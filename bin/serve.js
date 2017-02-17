#!/usr/bin/env node

'use strict'

const { Router } = require('express')
const { mkdir } = require('shelljs')
const resolveMod = require('resolve')
const gaze = require('gaze')

const createFsDriver = require('../fs')
const createDevelopmentDriver = require('../lib/development_driver')
const createStateSerializer = require('../lib/state')
const buildRuntime = require('./build_runtime')
const startServer = require('./start_server')
const createComponentMap = require('./create_component_map')

if (require.main === module) {
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const staticPrefix = args['static'] || args.s
  const ext = args['view-engine'] || args.v
  const basedir = args.basedir || args.b || process.cwd()
  const middlewareArgs = args['middleware'] || args.m
  const transformArgs = args['transform'] || args.t
  const config = require(`${process.cwd()}/package.json`).penguin
  if (process.env.NODE_ENV === 'production') {
    console.error('penguin: WARNING! You\'re running the `serve` command in production!')
    console.error('penguin:          Don\'t do this! Use the `run` command instead')
  }
  const middleware =
    Array.isArray(middlewareArgs)
      ? middlewareArgs
      : (middlewareArgs ? [middlewareArgs] : [])
  const transforms =
    Array.isArray(transformArgs)
      ? transformArgs
      : (transformArgs ? [transformArgs] : [])
  Promise.all([
    Promise.all(middleware.map(a => createModuleFromArgs(a, { basedir }))),
    Promise.all(transforms.map(a => createModuleFromArgs(a, { basedir })))
  ]).then(([middleware, transforms]) =>
    serve({ staticPrefix, ext, config, middleware, transforms })
  )
}

function serve ({
  staticPrefix = 'static',
  ext = 'dust',
  config,
  middleware = [],
  transforms = [],
  basedir = process.cwd()
}) {
  const { languages } = config
  mkdir('-p', '.penguin')
  const generateComponentMap = () =>
    createComponentMap({
      pattern: 'components/*',
      browser: true,
      output: '.penguin/components.js'
    })
  const componentPattern = 'components/*'
  gaze(componentPattern, function (err) {
    if (err) throw err
    this.on('added', generateComponentMap)
    this.on('deleted', generateComponentMap)
  })
  gaze('package.json', function (err) {
    if (err) throw err
    this.on('changed', generateComponentMap)
  })
  generateComponentMap()
    .then(() =>
      startServer({
        languages,
        viewDriver: createDevelopmentDriver({
          ext,
          prefix: '.',
          staticPrefix,
          filesPrefix: 'files',
          languages,
          dataPrefix: 'data'
        }),
        databaseDriver: createFsDriver({ prefix: 'data' }),
        middleware: [
          ...middleware,
          Router()
            .use('/static',
              buildRuntime.middleware({ ext: `.${ext}`, transforms }))
            .use((err, req, res, next) => {
              if (err.snippet) console.error(err.snippet)
              next(err)
            })
        ],
        stateSerializer: createStateSerializer({ config }),
        port: process.env.PORT || 3000
      })
    )
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
