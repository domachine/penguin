#!/usr/bin/env node

'use strict'

const fs = require('fs')
const vm = require('vm')
const subarg = require('subarg')
const resolveMod = require('resolve')

const createApp = require('../lib/app')

process.on('unhandledRejection', err => { throw err })
main(subarg(process.argv.slice(2)))

function main (args) {
  const prefix = args.prefix || 'dist'
  const runtimePath = args['server-runtime'] || args.s || 'server_runtime.js'
  const { languages } = require(`${process.cwd()}/package.json`).penguin
  const databaseDriverArgs = args['database-driver'] || args.d || {
    _: ['penguin.js/fs']
  }
  const viewDriverArgs = args['view-driver'] || args.v || {
    _: ['penguin.js/lib/production_driver']
  }
  const publishDriverArgs = args['publish-driver']
  const middlewareArgs = args['middleware'] || args.m
  const basedir = args.basedir || args.b || process.cwd()
  const port = args.port || args.p || 3000
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. --database-driver [ mydriver ])')
  }
  if (typeof viewDriverArgs !== 'object') {
    return error('no view driver given (e.g. --view-driver [ mydriver ])')
  }
  if (typeof publishDriverArgs !== 'object') {
    return error('no publish driver given (e.g. --publish-driver [ mydriver ])')
  }
  const runtime = new vm.Script(fs.readFileSync(runtimePath, 'utf-8'))
  const middleware =
    Array.isArray(middlewareArgs)
      ? middlewareArgs
      : (middlewareArgs ? [middlewareArgs] : [])
  Promise.all([
    createModuleFromArgs(databaseDriverArgs, { basedir }),
    createModuleFromArgs(viewDriverArgs, { basedir }),
    createModuleFromArgs(publishDriverArgs, { basedir }),
    Promise.all(middleware.map(a =>
      createModuleFromArgs(a, { basedir })
    ))
  ])
  .then(([databaseDriver, viewDriver, publishDriver, middleware]) => {
    const app = createApp({
      prefix,
      runtime,
      viewDriver,
      databaseDriver,
      publishDriver,
      languages,
      middleware
    })
    app.listen(port, () => {
      console.log('> Ready on port ' + port)
    })
  })
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

function error (msg) {
  console.error(msg)
  process.exit(1)
}
