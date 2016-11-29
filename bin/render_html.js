#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { Writable } = require('stream')
const { join, dirname } = require('path')
const vm = require('vm')
const mkdirp = require('mkdirp')
const subarg = require('subarg')
const loadJSON = require('load-json-file')
const writeJSON = require('write-json-file')
const cheerio = require('cheerio')
const Bluebird = require('bluebird')
const resolve = require('resolve')
const split = require('split')

process.on('unhandledRejection', err => { throw err })

const readFileAsync = Bluebird.promisify(fs.readFile)

main(subarg(process.argv.slice(2)))

function main (args) {
  const languageArgs = (args.languages || args.l)
  const languages =
    typeof languageArgs === 'string'
      ? [languageArgs]
      : (Array.isArray(languageArgs._) ? languageArgs._ : [])
  const runtimePath = args['server-runtime'] || args.s || 'server_runtime.js'
  const runtime = new vm.Script(fs.readFileSync(runtimePath, 'utf-8'))
  const databaseDriverArgs = args['database-driver'] || args.d
  const basedir = args.basedir || args.b || process.cwd()
  const prefix = args.prefix || args.p || 'docs'
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. -d [ mydriver ])')
  }
  if (languages.length === 0) {
    return error('no languages given (e.g. --languages [ de en ])')
  }
  const databaseDriverModule = databaseDriverArgs._.shift()
  resolve(databaseDriverModule, { basedir }, (err, p) => {
    if (err) throw err
    const createDriver = require(p)
    const databaseDriver = createDriver(databaseDriverArgs)
    process.stdin
      .pipe(split(JSON.parse, null, { trailing: false }))
      .pipe(createOutputStream({
        prefix,
        databaseDriver,
        writer: createHTMLWriter({ runtime, databaseDriver })
      }))
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}

function createOutputStream ({ prefix, databaseDriver, writer }) {
  const globalsCache = {}
  return new Writable({
    objectMode: true,
    write (chunk, enc, callback) {
      const { key, value, template, language } = chunk
      const path = join(prefix, key)
      const tplDataPath = join(prefix, template) + '.json'
      const tplHTMLPath = join(prefix, template) + '.html'
      Promise.all([
        globalsCache[language]
          ? Promise.resolve(globalsCache[language])
          : Promise.all([
            databaseDriver.getGlobals({ language }),
            databaseDriver.getGlobals({ language: null })
          ]).then(globals => Object.assign({}, ...globals)),
        readFileAsync(tplHTMLPath).catch(() => null),
        loadJSONSafe(tplDataPath)
      ])
      .then(([globals, tpl, meta]) => {
        if (tpl == null) return
        return (
          (chunk.object
            ? databaseDriver.getObjectLocals({
              type: chunk.object.type,
              id: chunk.object.id
            })
            : databaseDriver.getPageLocals({ name: chunk.page.name })
          )
          .then(notLocalized => {
            const fields = Object.assign({}, value, notLocalized, globals)
            if (meta == null) meta = {}
            return Promise.all([
              writeJSON(path + '.json', fields, { indent: null }),
              writer(path + '.html', tpl, { fields, meta, language })
            ])
          })
        )
      })
      .then(() => callback())
      .catch(callback)
    }
  })
}

function createHTMLWriter ({ runtime }) {
  return function writeRecordHTML (path, template, { fields, meta, language }) {
    return new Promise((resolve, reject) => {
      mkdirp(dirname(path), err => {
        if (err) return reject(err)
        const output = fs.createWriteStream(path)
        const data = { fields, meta, language }
        const ctx = vm.createContext({
          __params: { data, html: cheerio.load(template) }
        })
        runtime.runInContext(ctx)
        output.write(ctx.__params.output)
        output.end()
        resolve()
      })
    })
  }
}

function loadJSONSafe (p) {
  return loadJSON(p).catch(err => {
    if (err.code === 'ENOENT') return null
    throw err
  })
}
