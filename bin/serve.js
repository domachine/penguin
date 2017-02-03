#!/usr/bin/env node

'use strict'

const { PassThrough, Transform } = require('stream')
const browserify = require('browserify-middleware')
const { Router } = require('express')
const envify = require('envify')
const { mkdir } = require('shelljs')
const rollupify = require('rollupify')
const resolveMod = require('resolve')
const gaze = require('gaze')

const createFsDriver = require('../fs')
const createDevelopmentDriver = require('../lib/development_driver')
const createStateSerializer = require('../lib/state')
const renderClientRuntime = require('./render_client_runtime')
const compileTemplate = require('./compile_template')
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
  const config = require(`${process.cwd()}/package.json`).penguin
  if (process.env.NODE_ENV === 'production') {
    console.error('penguin: WARNING! You\'re running the `serve` command in production!')
    console.error('penguin:          Don\'t do this! Use the `run` command instead')
  }
  const middleware =
    Array.isArray(middlewareArgs)
      ? middlewareArgs
      : (middlewareArgs ? [middlewareArgs] : [])
  Promise.all(middleware.map(a => createModuleFromArgs(a, { basedir })))
    .then(middleware => serve({ staticPrefix, ext, config, middleware }))
}

function serve ({
  staticPrefix = 'static',
  ext = 'dust',
  config,
  middleware = [],
  basedir = process.cwd()
}) {
  const { languages } = config
  const rollupOpts = {
    config: {
      external: id => !id.startsWith('./') && !id.startsWith('/') && !id.startsWith('../'),
      plugins: [require('rollup-plugin-buble')()]
    }
  }
  const toTransform = fn =>
    file => file.endsWith(`.${ext}`) ? fn(file) : new PassThrough()
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
            .use('/static', browserify(process.cwd(), {
              grep: new RegExp(`\\.${ext}$`),
              standalone: 'Penguin',
              transform: [
                toTransform(file =>
                  new Transform({
                    transform (chunk, enc, callback) { callback() },
                    flush (callback) {
                      compileTemplate({ file })
                        .on('error', callback)
                        .on('data', d => this.push(d))
                        .on('end', () => callback())
                    }
                  })
                ),
                toTransform(() => renderClientRuntime()),
                file => rollupify(file + '.js', rollupOpts),
                envify
              ]
            }))
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
