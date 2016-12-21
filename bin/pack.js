#!/usr/bin/env node

'use strict'

const { dirname, join, basename, extname } = require('path')
const fs = require('fs')
const { spawn, spawnSync } = require('child_process')
const { cp, mkdir, rm } = require('shelljs')
const glob = require('glob')
const subarg = require('subarg')
const mkdirp = require('mkdirp')
const loadJSON = require('load-json-file')
const writeJSON = require('write-json-file')
const Bluebird = require('bluebird')

const createEngine = require('../lib/engine')
const createDustDriver = require('../lib/dust_driver')
const createPugDriver = require('../lib/pug_driver')
const { default: createServerRuntime } = require('../lib/server_runtime')

require('babel-register')({
  presets: [require('babel-preset-react')],
  plugins: [require('babel-plugin-transform-es2015-modules-commonjs')]
})

const writeFileAsync = Bluebird.promisify(fs.writeFile)
const mkdirpAsync = Bluebird.promisify(mkdirp)

process.on('unhandledRejection', err => { throw err })

const drivers = {
  html: createDustDriver,
  pug: createPugDriver
}

const { penguin: { languages } } = require(`${process.cwd()}/package.json`)
const args = subarg(process.argv.slice(2))
const prefix = args.prefix || args.p || 'docs'
const viewEngine = args['view-engine'] || args.v || 'html'
const serverRuntimePath =
  args['server-runtime'] || args.s || 'server_runtime.js'
const env = Object.assign({}, process.env, {
  NODE_ENV: 'production',
  BABEL_ENV: 'production'
})
spawnSync(`${__dirname}/create_component_map.js`, [
  'components', '-b', '-o', 'components.js'
], { stdio: 'inherit', env })
spawnSync(`${__dirname}/create_component_map.js`, [
  'components', '-o', 'server_components.js'
], { stdio: 'inherit', env })
const engine = createEngine({
  drivers,
  runtime: createServerRuntime({
    state: { isEditable: true, isLoading: true },
    components: require(join(process.cwd(), 'server_components')).default
  })
})
rm('-rf', prefix)
if (fs.existsSync('files')) cp('-R', 'files', prefix)
else mkdir('-p', prefix)
if (!fs.existsSync(join(prefix, 'index.html'))) {
  fs.writeFileSync(join(prefix, 'index.html'), renderIndexHTML({ languages }))
}
mkdir('-p', join(prefix, 'static'))
if (fs.existsSync('static')) rm('-f', 'static/client.js')
const opts = { stdio: ['ignore', 'pipe', 'inherit'], env }
spawn(`${__dirname}/build_server_runtime.js`, [], opts)
  .stdout.pipe(fs.createWriteStream(serverRuntimePath))
spawn(`${__dirname}/build_client_runtime.js`, [], opts)
  .stdout.pipe(fs.createWriteStream(join(prefix, 'static', 'client.js')))
const files = glob.sync('@(objects|pages)/*.' + viewEngine)
Promise.all(
  files.map(file => {
    const d = dirname(file)
    const e = extname(file)
    const b = basename(file, e)
    const htmlOutput = join(prefix, d, b + '.html')
    const jsonOutput = join(prefix, d, b + '.json')
    const metaJSON = join(d, b + '.json')
    return Promise.all([
      mkdirpAsync(dirname(htmlOutput)).then(() => engine(file)),
      loadJSON(metaJSON).catch(err => {
        if (err.code === 'ENOENT') return {}
        throw err
      })
    ])
    .then(([content, meta]) =>
      Promise.all([
        writeFileAsync(htmlOutput, content),
        writeJSON(jsonOutput, meta, { indent: null })
      ])
    )
  })
)
if (fs.existsSync('static')) cp('-R', 'static', prefix)

function renderIndexHTML ({ languages }) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Redirecting ...</title>
    <meta http-equiv='refresh' content='0; URL=/${languages[0]}/'>
  </head>
  <body>
    Redirecting <a href='/${languages[0]}/'>here</a> ...
  </body>
</html>
`
}
