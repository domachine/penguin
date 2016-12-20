#!/usr/bin/env node

'use strict'

const subarg = require('subarg')
const resolveMod = require('resolve')

const createApp = require('../lib/app')

process.on('unhandledRejection', err => { throw err })
main(subarg(process.argv.slice(2)))

function main (args) {
  const { languages } = require(`${process.cwd()}/package.json`).penguin
  const databaseDriverArgs = args['database-driver'] || args.d || {
    _: ['penguin.js/fs']
  }
  const viewDriverArgs = args['view-driver'] || args.v || {
    _: ['penguin.js/lib/production_driver']
  }
  const middlewareArgs = args['middleware'] || args.m
  const basedir = args.basedir || args.b || process.cwd()
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. -d [ mydriver ])')
  }
  if (typeof viewDriverArgs !== 'object') {
    return error('no view driver given (e.g. -d [ mydriver ])')
  }
  const middleware =
    Array.isArray(middlewareArgs)
      ? middlewareArgs
      : (middlewareArgs ? [middlewareArgs] : [])
  Promise.all([
    createModuleFromArgs(databaseDriverArgs, { basedir }),
    createModuleFromArgs(viewDriverArgs, { basedir }),
    Promise.all(middleware.map(a =>
      createModuleFromArgs(a, { basedir })
    ))
  ])
  .then(([databaseDriver, viewDriver, middleware]) => {
    const app = createApp({ viewDriver, databaseDriver, languages, middleware })
    app.listen(process.env.PORT || 3000, () => {
      console.log('> Ready on port ' + (process.env.PORT || 3000))
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
