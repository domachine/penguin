#!/usr/bin/env node

'use strict'

const { PassThrough, Transform } = require('stream')
const { spawn } = require('child_process')
const browserify = require('browserify-middleware')
const { Router } = require('express')
const envify = require('envify')
const { mkdir } = require('shelljs')
const rollupify = require('rollupify')

const createFsDriver = require('../fs')
const createDevelopmentDriver = require('../lib/development_driver')
const createStateSerializer = require('../lib/state')
const renderClientRuntime = require('./render_client_runtime')
const compileTemplate = require('./compile_template')
const startServer = require('./start_server')

if (require.main === module) {
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const staticPrefix = args['static'] || args.s
  const ext = args['view-engine'] || args.v
  const config = require(`${process.cwd()}/package.json`).penguin
  if (process.env.NODE_ENV === 'production') {
    console.error('WARNING! You\'re running penguin.js in production but it\'s not ready, yet!')
  }
  serve({ staticPrefix, ext, config })
}

function serve ({ staticPrefix = 'static', ext = 'dust', config }) {
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
  spawn(`${__dirname}/create_component_map.js`, [
    'components', '-w', '-b', '-o', '.penguin/components.js'
  ], { stdio: 'inherit' })
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
}
