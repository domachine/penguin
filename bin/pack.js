#!/usr/bin/env node

'use strict'

const { dirname, join, basename, extname } = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const { cp, mkdir, rm } = require('shelljs')
const glob = require('glob')
const minimist = require('minimist')
const mkdirp = require('mkdirp')

const createEngine = require('../lib/engine')
const createDustDriver = require('../lib/dust_driver')
const createPugDriver = require('../lib/pug_driver')
const { default: renderer } = require('../server')

require('babel-register')({
  presets: [require('babel-preset-react')],
  plugins: [require('babel-plugin-transform-es2015-modules-commonjs')]
})

process.on('unhandledRejection', err => { throw err })

const drivers = {
  html: createDustDriver,
  pug: createPugDriver
}

const args = minimist(process.argv.slice(2))
const prefix = args.prefix || args.p || 'pack'
const viewEngine = args['view-engine'] || args.v || 'html'
const env = Object.assign({}, process.env, {
  NODE_ENV: 'production',
  BABEL_ENV: 'production'
})
const engine = createEngine({
  drivers,
  renderer,
  components: require(join(process.cwd(), 'components')).default
})
mkdir('-p', prefix)
mkdir('-p', join(prefix, 'static'))
if (fs.existsSync('static')) rm('-rf', 'static/client.js')
const opts = { stdio: ['ignore', 'pipe', 'inherit'], env }
spawn(`${__dirname}/build_server_renderer.js`, [], opts)
  .stdout.pipe(fs.createWriteStream(join(prefix, 'server_renderer.js')))
spawn(`${__dirname}/build_client_renderer.js`, [], opts)
  .stdout.pipe(fs.createWriteStream(join(prefix, 'static', 'client.js')))
const files = glob.sync('@(objects|pages)/**/*.' + viewEngine)
Promise.all(
  files.map(file => {
    const d = dirname(file)
    const e = extname(file)
    const b = basename(file, e)
    const output = join(prefix, d, b + '.html')
    return new Promise((resolve, reject) => {
      mkdirp(dirname(output), err => {
        if (err) return reject(err)
        resolve(engine(file))
      })
    })
    .then(content =>
      new Promise((resolve, reject) => {
        fs.writeFile(output, content, err => err ? reject(err) : resolve())
      })
    )
  })
)
if (fs.existsSync('static')) cp('-R', 'static', prefix)
