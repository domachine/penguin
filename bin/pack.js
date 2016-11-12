#!/usr/bin/env node

'use strict'

const { dirname, join } = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const { cp, mkdir } = require('shelljs')
const glob = require('glob')
const minimist = require('minimist')
const mkdirp = require('mkdirp')

const createDustEngine = require('../lib/dust_engine')
const createPugEngine = require('../lib/pug_engine')

process.on('unhandledRejection', err => { throw err })

const engines = {
  html: createDustEngine,
  pug: createPugEngine
}

const args = minimist(process.argv.slice(2))
const prefix = args.prefix || args.p || 'pack'
const viewEngine = args['view-engine'] || args.v || 'html'
const env = Object.assign({}, process.env, {
  NODE_ENV: 'production',
  BABEL_ENV: 'production'
})
const render = engines[viewEngine]({ assetPrefix: '' })
mkdir('-p', prefix)
const opts = { stdio: ['ignore', 'pipe', 'inherit'], env }
spawn(`${__dirname}/build_server_renderer.js`, [], opts)
  .stdout.pipe(fs.createWriteStream(join(prefix, 'server_renderer.js')))
const files = glob.sync('@(objects|pages)/**/*.' + viewEngine)
Promise.all(
  files.map(file => {
    const name = file.replace(/\.[^.]+$/, '')
    const output = join(prefix, file)
    return new Promise((resolve, reject) => {
      mkdirp(dirname(output), err => {
        if (err) return reject(err)
        resolve(render(name))
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
