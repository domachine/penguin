#!/usr/bin/env node

'use strict'

const { parse } = require('path')
const vm = require('vm')
const fs = require('fs')
const { join } = require('path')
const { rm } = require('shelljs')
const mergeStream = require('merge-stream')
const ncp = require('ncp')
const resolveMod = require('resolve')
const Bluebird = require('bluebird')

const scanObjects = require('./scan_objects')
const scanPages = require('./scan_pages')
const renderHTML = require('./render_html')

const { penguin: config } = require(join(process.cwd(), 'package.json'))

module.exports = build

const ncpAsync = Bluebird.promisify(ncp)

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  // const runtimePath = args['server-runtime'] || args.s || 'server_runtime.js'
  const defaultDriver = { _: ['penguin.js/fs'], prefix: 'data' }
  const databaseDriverArgs = args['database-driver'] || args.d || defaultDriver
  const basedir = args.basedir || args.b || process.cwd()
  // const prefix = args.prefix || args.p || 'dist'
  const output = args.output || args.o
  // const runtime = new vm.Script(fs.readFileSync(runtimePath, 'utf-8'))
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. -d [ mydriver ])')
  }
  createModuleFromArgs(databaseDriverArgs, { basedir })
    .then(databaseDriver => {
      build({ databaseDriver, config, output })
    })
}

function build ({ databaseDriver, config, output = 'build' }) {
  const { languages } = config
  const objects = scanObjects({ databaseDriver, languages })
  const pages = scanPages({ databaseDriver, languages })
  const render = renderHTML({ databaseDriver, config, output })
  return ncpAsync('files', output)
    .then(() =>
      Promise.all([
        ncpAsync('static', join(output, 'static')),
        new Promise((resolve, reject) => {
          mergeStream(objects, pages)
            .pipe(render)
            .on('error', reject)
            .on('finish', () => resolve())
        })
      ])
    )
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}

function createModuleFromArgs (a, opts) {
  const name = a._[0]
  const args = Object.assign({}, a, { _: a._.slice(1) })
  return createModule(name, opts, args)
}

function createModule (mod, opts, ...args) {
  return new Promise((resolve, reject) => {
    resolveMod(mod, opts, (err, p) => {
      if (err) return reject(err)
      const constructor = require(p)
      resolve(constructor(...args))
    })
  })
}
