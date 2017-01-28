#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { Writable } = require('stream')
const { join, dirname } = require('path')
const vm = require('vm')
const mkdirp = require('mkdirp')
const loadJSON = require('load-json-file')
const cheerio = require('cheerio')
const Bluebird = require('bluebird')
const resolve = require('resolve')
const split = require('split')
const serialize = require('serialize-javascript')

const createStateSerializer = require('../lib/state')

module.exports = createOutputStream

const readFileAsync = Bluebird.promisify(fs.readFile)

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const databaseDriverArgs = args['database-driver'] || args.d
  const basedir = args.basedir || args.b || process.cwd()
  const output = args.output || args.o
  const { penguin: config } = require(`${process.cwd()}/package.json`)
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. -d [ mydriver ])')
  }
  const databaseDriverModule = databaseDriverArgs._.shift()
  resolve(databaseDriverModule, { basedir }, (err, p) => {
    if (err) throw err
    const createDriver = require(p)
    const databaseDriver = createDriver(databaseDriverArgs)
    process.stdin
      .pipe(split(JSON.parse, null, { trailing: false }))
      .pipe(createOutputStream({ databaseDriver, config, output }))
      .on('finish', () => {
        if (databaseDriver.close) databaseDriver.close()
      })
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}

function createOutputStream ({ databaseDriver, config, output = 'build' }) {
  const globalsCache = {}
  const writer = createHTMLWriter({
    stateSerializer: createStateSerializer({ config })
  })
  return new Writable({
    objectMode: true,
    write (chunk, enc, callback) {
      const { key, value, template, language } = chunk
      const path = join(output, key)
      const tplDataPath = template + '.json'
      const tplHTMLPath = template + '.html'
      const tplJSPath = template + '.js'
      Promise.all([
        globalsCache[language]
          ? Promise.resolve(globalsCache[language])
          : Promise.all([
            databaseDriver.getGlobals({ language }),
            databaseDriver.getGlobals({ language: null })
          ]).then(globals => Object.assign({}, ...globals)),
        readFileAsync(tplHTMLPath).catch(() => null),
        loadJSONSafe(tplDataPath),
        readFileAsync(tplJSPath)
      ])
      .then(([globals, tpl, meta, js]) => {
        if (tpl == null) return
        return (
          (chunk.object
            ? databaseDriver.getObject({
              type: chunk.object.type,
              id: chunk.object.id
            })
            : databaseDriver.getPage({ name: chunk.page.name })
          )
          .then(notLocalized => {
            const fields = Object.assign({}, value, notLocalized, globals)
            if (meta == null) meta = {}
            return writer(path + '.html', tpl, js, { fields, meta, language })
          })
        )
      })
      .then(() => callback())
      .catch(callback)
    }
  })
}

function createHTMLWriter ({ stateSerializer }) {
  return (path, template, js, { fields, meta, language }) =>
    new Promise((resolve, reject) => {
      console.error('render %s', path)
      mkdirp(dirname(path), err => {
        if (err) return reject(err)
        const output = fs.createWriteStream(path)
        const $ = cheerio.load(template)
        const m = { exports: {} }
        const ctx = vm.createContext({ $, module: m, exports: m.exports })
        const state = stateSerializer({ fields, meta, language })
        state.isBuilt = true
        state.isEditable = false
        const renderer = new vm.Script(
  `${js}
  module.exports(${JSON.stringify(state)}, $)`
        )
        renderer.runInContext(ctx)
        $('body').append(
          `<script>window.Penguin(${
            serialize(state, { isJSON: true })
          })</script>`
        )
        output.write($.html())
        output.end()
        resolve()
      })
    })
}

function loadJSONSafe (p) {
  return loadJSON(p).catch(err => {
    if (err.code === 'ENOENT') return null
    throw err
  })
}
