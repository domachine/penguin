'use strict'

const { Router } = require('express')
const { mkdir } = require('shelljs')
const gaze = require('gaze')

const createFsDriver = require('../fs')
const createDevelopmentDriver = require('../lib/development_driver')
const buildRuntime = require('./build_runtime')
const startServer = require('./start_server')
const createComponentMap = require('./create_component_map')

module.exports = serve

function serve ({
  staticPrefix = 'static',
  ext = 'pug',
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
        config,
        port: process.env.PORT || 3000
      })
    )
}
