#!/usr/bin/env node

'use strict'

const crypto = require('crypto')
const { dirname, join, basename, extname } = require('path')
const fs = require('fs')
const { mkdir, test } = require('shelljs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const loadJSON = require('load-json-file')
const Bluebird = require('bluebird')
const resolveMod = require('resolve')

const renderIndexHTML = require('../pages/index')
const render404HTML = require('../pages/404')
const buildRuntime = require('./build_runtime')
const compileTemplate = require('../lib/penguin_template')
const createComponentMap = require('./create_component_map')

const mkdirpAsync = Bluebird.promisify(mkdirp)
const writeFileAsync = Bluebird.promisify(fs.writeFile)
const readFileAsync = Bluebird.promisify(fs.readFile)

module.exports = pack

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

const drivers = {
  pug: require('../pug')
}

function main (args) {
  const { penguin: { languages } } = require(`${process.cwd()}/package.json`)
  const viewEngine = args['view-engine'] || args.v
  const basedir = args.basedir || args.b || process.cwd()
  const transformArgs = args['transform'] || args.t
  const transforms =
    Array.isArray(transformArgs)
      ? transformArgs
      : (transformArgs ? [transformArgs] : [])
  Promise.all(
    transforms.map(a => createModuleFromArgs(a, { basedir }))
  ).then(transforms =>
    pack({ viewEngine, languages, transforms })
  )
}

function pack ({ viewEngine = 'dust', languages, transforms }) {
  mkdir('-p', 'files')
  mkdir('-p', 'static')
  mkdir('-p', '.penguin')
  if (!test('-f', 'files/index.html')) {
    fs.writeFileSync('files/index.html', renderIndexHTML({ languages }))
  }
  if (!test('-f', 'files/404.html')) {
    fs.writeFileSync('files/404.html', render404HTML({ languages }))
  }
  const files = glob.sync('@(objects|pages)/*.' + viewEngine)
  return Promise.all([
    createComponentMap({
      browser: true,
      pattern: 'components/*',
      output: '.penguin/components.js'
    }),
    createComponentMap({ output: '.penguin/server_components.js' })
  ])
  .then(() =>
    files.reduce((p, file) =>
      p.then(files => {
        console.error('penguin: build server runtime for %s', file)
        return buildRuntime({ file, mode: 'server', transforms }).then(code =>
          writeFileAsync(file.replace(/\.[^.]+$/, '.js'), code)
        ).then(() => {
          console.error('penguin: build client runtime for %s', file)
          return Promise.all(['development', 'production'].map(env =>
            buildRuntime({ file, mode: 'client', transforms, penguinEnv: env })
              .then(code => {
                const hash = crypto.createHash('md5').update(code).digest('hex')
                const path =
                  join('static', file.replace(/\.[^.]+$/, `.${env}.${hash}.js`))
                mkdir('-p', dirname(path))
                return writeFileAsync(path, code).then(() => '/' + path)
              })
          ))
        })
        .then(runtimePaths => [...files, runtimePaths])
      }), Promise.resolve([]))
  )
  .then((filesRuntimes) =>
    Promise.all(
      files.map((file, i) => {
        const d = dirname(file)
        const e = extname(file)
        const b = basename(file, e)
        const htmlOutput = join(d, b + '.html')
        const metaJSON = join(d, b + '.json')
        return Promise.all([
          mkdirpAsync(dirname(htmlOutput)).then(() =>
            readFileAsync(file)
          ).then(source => {
            const driver = drivers[viewEngine]
            const code = compileTemplate(source, {
              scriptPath: filesRuntimes[i][0],
              productionScriptPath: filesRuntimes[i][1],
              driver: driver ? driver() : null
            })
            return writeFileAsync(htmlOutput, code)
          }),
          loadJSON(metaJSON).catch(err => {
            if (err.code === 'ENOENT') return {}
            throw err
          })
        ])
      })
    )
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
