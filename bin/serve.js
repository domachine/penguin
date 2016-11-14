#!/usr/bin/env node

'use strict'

const http = require('http')
const fs = require('fs')
const { join } = require('path')
const express = require('express')
const minimist = require('minimist')
const browserify = require('browserify')
const watchify = require('watchify')
const mkdirp = require('mkdirp')

const createApp = require('../lib/app')
const createClientRendererScript = require('../lib/client_renderer_script')
const createEngine = require('../lib/engine')
const createDustDriver = require('../lib/dust_driver')
const createPugDriver = require('../lib/pug_driver')
const pkg = require('../package.json')

const drivers = {
  html: createDustDriver,
  pug: createPugDriver
}

const args = minimist(process.argv.slice(2))
const staticPrefix = args['static'] || args.s || 'static'
const ext = args['view-engine'] || args.v || 'html'
const engine = createEngine({
  drivers,
  driverParams: {
    assetPrefix: `http://localhost:${process.env.STATIC_PORT || 8080}`
  }
})
const app = createApp({ engine, ext })
const b = browserify({
  entries: [createClientRendererScript(pkg)],
  basedir: process.cwd(),
  cache: {},
  packageCache: {},
  plugin: [watchify]
})
.transform('babelify', { presets: ['react', 'es2015'] })
.transform('envify', { _: 'purge' })
b.on('log', msg => console.log(msg))
b.on('update', bundle)
mkdirp('static', bundle)
const s = express().use(express.static(join(process.cwd(), staticPrefix)))
http.createServer(s).listen(process.env.STATIC_PORT || 8080, () => {
  console.log('> Static server ready on port ' + (process.env.STATIC_PORT || 8080))
})
app.listen(process.env.PORT || 3000, () => {
  console.log('> Ready on port ' + (process.env.PORT || 3000))
})

function bundle () {
  b.bundle()
    .on('error', err => { console.error(err.message) })
    .pipe(fs.createWriteStream(join(staticPrefix, 'client.js')))
}
