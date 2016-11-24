#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { join, dirname, basename } = require('path')
const vm = require('vm')
const co = require('co')
const glob = require('glob')
const mkdirp = require('mkdirp')
const { cp, mkdir, rm } = require('shelljs')
const minimist = require('minimist')
const loadJSON = require('load-json-file')
const writeJSON = require('write-json-file')
const cheerio = require('cheerio')

const createFsDriver = require('../lib/fs_driver')
const { penguin: config } = require(join(process.cwd(), 'package.json'))

process.on('unhandledRejection', err => { throw err })

const args = minimist(process.argv.slice(2))
const prefix = args['template-prefix'] || args.p || 'docs'
const databasePrefix = args['data-prefix'] || args.d || 'data'
const runtimePath = join(prefix, 'server_runtime.js')
const staticFiles = join(prefix, 'static')
const runtime = new vm.Script(fs.readFileSync(runtimePath, 'utf-8'))
const databaseDriver = createFsDriver({ prefix: databasePrefix })

const hasStatic = fs.existsSync(staticFiles)

co(function * () {
  rm('-rf', join(prefix, 'data'))
  const website = yield databaseDriver.getWebsite()
  const files = glob.sync(join(prefix, 'templates/pages', '*.html'))
  const ids = yield databaseDriver.getObjectIDs()
  yield Promise.all(config.languages.map(lang => {
    const langOutput = join(prefix, lang)
    rm('-rf', langOutput)
    mkdir(langOutput)
    if (hasStatic) cp('-R', staticFiles, langOutput)
    Promise.all([
      databaseDriver.getWebsite().then(website =>
        writeJSON(join(prefix, 'data/website.json'), website, { indent: null })
      ),
      Promise.all(files.map(co.wrap(function * (file) {
        const name = basename(file, '.html')
        const page = yield databaseDriver.getPage(name)
        const tplPath = join(prefix, 'templates/pages', name + '.json')
        const tpl = yield loadJSONSafe(tplPath)
        if (!tpl) return
        const { content: template, meta } = tpl
        const path = join(langOutput, name + '.html')
        yield writeJSON(join(prefix, 'data/pages', name + '.json'), page, { indent: null })
        yield writeRecordHTML(
          path, { website, template, record: page, meta, language: lang }
        )
      }))),
      Promise.all(ids.map(co.wrap(function * (id) {
        const object = yield databaseDriver.getObject(id)
        const tplPath = join(prefix, 'templates/objects', object.type + '.json')
        const tpl = yield loadJSONSafe(tplPath)
        if (!tpl) return
        const { content: template, meta } = tpl
        const path = join(langOutput, object.type, id + '.html')
        yield writeJSON(join(prefix, 'data/objects', id + '.json'), object, { indent: null })
        yield writeRecordHTML(
          path, { website, template, record: object, meta, language: lang }
        )
      })))
    ])
  }))
})

function writeRecordHTML (
  outputFile, { website, template, record, meta, language }
) {
  return new Promise((resolve, reject) => {
    mkdirp(dirname(outputFile), err => {
      if (err) return reject(err)
      const output = fs.createWriteStream(outputFile)
      const data = { website, meta, record }
      const ctx = vm.createContext({
        __params: { data, language, html: cheerio.load(template) }
      })
      runtime.runInContext(ctx)
      output.write(ctx.__params.output)
      output.end()
    })
  })
}

function loadJSONSafe (p) {
  return loadJSON(p).catch(err => {
    if (err.code === 'ENOENT') return null
    throw err
  })
}
