#!/usr/bin/env node

'use strict'

const { dirname, join, basename, extname } = require('path')
const fs = require('fs')
const { spawn, spawnSync } = require('child_process')
const { cp, mkdir, rm } = require('shelljs')
const glob = require('glob')
const minimist = require('minimist')
const mkdirp = require('mkdirp')
const loadJSON = require('load-json-file')
const writeJSON = require('write-json-file')
const Bluebird = require('bluebird')

const createEngine = require('../lib/engine')
const createDustDriver = require('../lib/dust_driver')
const createPugDriver = require('../lib/pug_driver')
const { default: createServerRenderer } = require('../server_renderer')

require('babel-register')({
  presets: [require('babel-preset-react')],
  plugins: [require('babel-plugin-transform-es2015-modules-commonjs')]
})

const writeFileAsync = Bluebird.promisify(fs.writeFile)
const mkdirpAsync = Bluebird.promisify(mkdirp)

process.on('unhandledRejection', err => { throw err })

const drivers = {
  html: createDustDriver,
  pug: createPugDriver
}

const args = minimist(process.argv.slice(2))
const prefix = args.prefix || args.p || 'docs'
const viewEngine = args['view-engine'] || args.v || 'html'
const env = Object.assign({}, process.env, {
  NODE_ENV: 'production',
  BABEL_ENV: 'production'
})
spawnSync(`${__dirname}/create_component_map.js`, [
  'components', '-o', 'components.js'
], { stdio: 'inherit', env })
const engine = createEngine({
  drivers,
  renderer: createServerRenderer({
    state: { isEditable: true, isFetching: true },
    components: require(join(process.cwd(), 'components')).default
  })
})
mkdir('-p', prefix)
mkdir('-p', join(prefix, 'static'))
if (fs.existsSync('static')) rm('-f', 'static/client.js')
const opts = { stdio: ['ignore', 'pipe', 'inherit'], env }
spawn(`${__dirname}/build_server_runtime.js`, [], opts)
  .stdout.pipe(fs.createWriteStream(join(prefix, 'server_runtime.js')))
spawn(`${__dirname}/build_client_runtime.js`, [], opts)
  .stdout.pipe(fs.createWriteStream(join(prefix, 'static', 'client.js')))
const files = glob.sync('@(objects|pages)/*.' + viewEngine)
Promise.all(
  files.map(file => {
    const d = dirname(file)
    const e = extname(file)
    const b = basename(file, e)
    const htmlOutput = join(prefix, 'templates', d, b + '.html')
    const jsonOutput = join(prefix, 'templates', d, b + '.json')
    const metaJSON = join(d, b + '.meta.json')
    return Promise.all([
      mkdirpAsync(dirname(htmlOutput))
        .then(() => engine(file, { signature: [d.slice(0, -1), b] })),
      loadJSON(metaJSON).catch(err => {
        if (err.code === 'ENOENT') return {}
        throw err
      })
    ])
    .then(([content, meta]) => {
      const json = { content, meta }
      return Promise.all([
        writeFileAsync(htmlOutput, content),
        writeJSON(jsonOutput, json, { indent: null })
      ])
    })
  })
)
if (fs.existsSync('static')) cp('-R', 'static', prefix)
