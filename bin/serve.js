#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { spawn, spawnSync } = require('child_process')
const subarg = require('subarg')
const browserify = require('browserify-middleware')
const { Router } = require('express')
const babelify = require('babelify')
const envify = require('envify')

const createApp = require('../lib/app')
const createClientRuntimeScript = require('../lib/client_runtime_script')
const createEngine = require('../lib/engine')
const createDustDriver = require('../lib/dust_driver')
const createPugDriver = require('../lib/pug_driver')
const createFsDriver = require('../fs')
const createDevelopmentDriver = require('../lib/development_driver')
const pkg = require('../package.json')

const drivers = {
  html: createDustDriver,
  pug: createPugDriver
}

const args = subarg(process.argv.slice(2))
const staticPrefix = args['static'] || args.s || 'static'
const ext = args['view-engine'] || args.v || 'html'
const { languages } = require(`${process.cwd()}/package.json`).penguin
const engine = createEngine({ drivers })
if (process.env.NODE_ENV === 'production') {
  console.error('WARNING! You\'re running penguin.js in production but it\'s not ready, yet!')
}
const viewDriver = createDevelopmentDriver({
  engine,
  ext,
  prefix: '.',
  staticPrefix,
  filesPrefix: 'files',
  languages,
  dataPrefix: 'data'
})
const router = Router()
router.use('/static', browserify('.', {
  transform: [
    babelify.configure({
      presets: [
        require('babel-preset-react'),
        require('babel-preset-es2015')
      ]
    }),
    envify
  ]
}))
const app = createApp({
  languages,
  viewDriver,
  databaseDriver: createFsDriver({ prefix: 'data' }),
  middleware: [router]
})
spawnSync(`${__dirname}/create_component_map.js`, [
  'components', '-b', '-o', 'components.js'
], { stdio: 'inherit' })
spawn(`${__dirname}/create_component_map.js`, [
  'components', '-w', '-b', '-o', 'components.js'
], { stdio: 'inherit' })
fs.writeFileSync('client.js', createClientRuntimeScript(pkg))
app.listen(process.env.PORT || 3000, () => {
  console.log('> Ready on port ' + (process.env.PORT || 3000))
})
