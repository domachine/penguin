#!/usr/bin/env node

'use strict'

const subarg = require('subarg')
const resolveMod = require('resolve')

const createStateSerializer = require('../lib/state')
const startServer = require('./start_server')

process.on('unhandledRejection', err => { throw err })
main(subarg(process.argv.slice(2)))

function main (args) {
  const prefix = args.prefix || 'dist'
  const config = require(`${process.cwd()}/package.json`).penguin
  const { languages } = config
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
    return error('penguin: no database driver given (e.g. --database-driver [ mydriver ])')
  }
  if (typeof viewDriverArgs !== 'object') {
    return error('penguin: no view driver given (e.g. --view-driver [ mydriver ])')
  }
  if (typeof publishDriverArgs !== 'object') {
    return error('penguin: no publish driver given (e.g. --publish-driver [ mydriver ])')
  }
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
    startServer({
      prefix,
      viewDriver,
      databaseDriver,
      publishDriver,
      languages,
      middleware,
      port,
      stateSerializer: createStateSerializer({ config })
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
