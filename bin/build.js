#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { join, dirname } = require('path')
const { Script } = require('vm')
const { basename } = require('path')
const co = require('co')
const glob = require('glob')
const mkdirp = require('mkdirp')
const { cp, mkdir, rm } = require('shelljs')
const minimist = require('minimist')
const { createStore, combineReducers } = require('redux')
const { map: reducers } = require('@webdesignio/floorman/reducers')

const createRenderer = require('../lib/server_renderer')
const createDatabase = require('../lib/database')
const createTemplateManager = require('../lib/template_manager')
const toFloormanFormat = require('../lib/to_floorman_format')

process.on('unhandledRejection', err => { throw err })

const args = minimist(process.argv.slice(2))
const templatePrefix = args['template-prefix'] || args.p || 'pack'
const databasePrefix = args['data-prefix'] || args.d || 'data'
const output = args.output || args.o || 'dist'

const scriptPath = join(templatePrefix, 'renderer.js')
const script = new Script(fs.readFileSync(scriptPath, 'utf-8'))
const database = createDatabase({ prefix: databasePrefix })
const templateManager = createTemplateManager({ prefix: templatePrefix })
const renderer = createRenderer({ script })
const staticFiles = join(templatePrefix, 'static')

rm('-rf', output)
if (fs.existsSync(staticFiles)) cp('-R', staticFiles, output)
else mkdir(output)
co(build)

function * build () {
  const website = yield database.getWebsite()

  const files = glob.sync(join(templatePrefix, 'pages', '*.html'))
  yield Promise.all(files.map(co.wrap(function * (file) {
    const name = basename(file, '.html')
    const page = yield database.getPage(name)
    const res = yield templateManager.getTemplate('page', name)
    if (!res) return
    const { content: template, meta } = res
    const path = join(output, name + '.html')
    yield writeRecordHTML(path, { website, template, record: page, meta })
  })))

  const ids = yield database.getObjectIDs()
  yield Promise.all(ids.map(co.wrap(function * (id) {
    const object = yield database.getObject(id)
    const res = yield templateManager.getTemplate('object', object.type)
    if (!res) return
    const { content: template, meta } = res
    const path = join(output, object.type, id + '.html')
    yield writeRecordHTML(path, { website, template, record: object, meta })
  })))
}

function writeRecordHTML (outputFile, { website, template, record, meta }) {
  return new Promise((resolve, reject) => {
    mkdirp(dirname(outputFile), err => {
      if (err) return reject(err)
      const o = fs.createWriteStream(outputFile)
      const state = toFloormanFormat({ website, meta, record })
      const store = createStore(combineReducers(reducers), state)
      const params = { props: { store } }
      resolve(renderer(template, o, params))
    })
  })
}
