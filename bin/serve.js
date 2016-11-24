#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { join } = require('path')
const { spawn, spawnSync } = require('child_process')
const minimist = require('minimist')
const browserify = require('browserify')
const watchify = require('watchify')
const mkdirp = require('mkdirp')
const babelify = require('babelify')
const envify = require('envify')

const createApp = require('../lib/app')
const createClientRuntimeScript = require('../lib/client_runtime_script')
const createEngine = require('../lib/engine')
const createDustDriver = require('../lib/dust_driver')
const createPugDriver = require('../lib/pug_driver')
const createFsDriver = require('../lib/fs_driver')
const pkg = require('../package.json')

const drivers = {
  html: createDustDriver,
  pug: createPugDriver
}

const args = minimist(process.argv.slice(2))
const defaultLanguage = process.env.npm_package_penguin_languages_0
const staticPrefix = args['static'] || args.s || 'static'
const ext = args['view-engine'] || args.v || 'html'
const engine = createEngine({ drivers })
const app = createApp({
  engine,
  ext,
  staticPrefix,
  defaultLanguage,
  dataPrefix: 'data',
  databaseDriver: createFsDriver({ prefix: 'data' })
})
spawnSync(`${__dirname}/create_component_map.js`, [
  'components', '-b', '-o', 'components.js'
], { stdio: 'inherit' })
spawn(`${__dirname}/create_component_map.js`, [
  'components', '-w', '-b', '-o', 'components.js'
], { stdio: 'inherit' })
const b = browserify({
  entries: [createClientRuntimeScript(pkg)],
  basedir: process.cwd(),
  cache: {},
  packageCache: {},
  plugin: [watchify]
})
.transform(babelify.configure({
  presets: [
    require('babel-preset-react'),
    require('babel-preset-es2015')
  ]
}))
.transform(envify)
b.on('log', msg => console.log(msg))
b.on('update', bundle)
mkdirp('static', bundle)
app.listen(process.env.PORT || 3000, () => {
  console.log('> Ready on port ' + (process.env.PORT || 3000))
})

function bundle () {
  b.bundle()
    .on('error', err => { console.error(err.message) })
    .pipe(fs.createWriteStream(join(staticPrefix, 'client.js')))
}
