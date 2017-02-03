#!/usr/bin/env node

'use strict'

const crypto = require('crypto')
const { Writable } = require('stream')
const { dirname, join, basename, extname } = require('path')
const fs = require('fs')
const { mkdir, test } = require('shelljs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const loadJSON = require('load-json-file')
const Bluebird = require('bluebird')

const renderIndexHTML = require('../pages/index')
const render404HTML = require('../pages/404')
const buildClientRuntime = require('./build_client_runtime')
const buildServerRuntime = require('./build_server_runtime')
const compileTemplate = require('./compile_template')
const createComponentMap = require('./create_component_map')

const mkdirpAsync = Bluebird.promisify(mkdirp)

module.exports = pack

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const { penguin: { languages } } = require(`${process.cwd()}/package.json`)
  const viewEngine = args['view-engine'] || args.v
  pack({ viewEngine, languages })
}

function pack ({ viewEngine = 'dust', languages }) {
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
      p.then(files =>
        new Promise((resolve, reject) => {
          console.error('penguin: build server runtime for %s', file)
          buildServerRuntime({ file })
            .on('error', reject)
            .pipe(fs.createWriteStream(file.replace(/\.[^.]+$/, '.js')))
            .on('error', reject)
            .on('finish', () => resolve())
        })
        .then(() => {
          let buffer = ''
          const hash = crypto.createHash('md5')
          return new Promise((resolve, reject) => {
            console.error('penguin: build client runtime for %s', file)
            buildClientRuntime({ file })
              .on('error', reject)
              .pipe(new Writable({
                write (chunk, enc, callback) {
                  hash.update(chunk)
                  buffer += chunk
                  callback()
                }
              }))
              .on('finish', () => {
                const path =
                  join(
                    'static',
                    file.replace(/\.[^.]+$/, `.${hash.digest('hex')}.js`)
                  )
                mkdir('-p', dirname(path))
                fs.writeFile(path, buffer, err =>
                  err ? reject(err) : resolve([...files, '/' + path])
                )
              })
          })
        })
      )
    , Promise.resolve([]))
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
            new Promise((resolve, reject) => {
              console.error('penguin: compile template %s', file)
              compileTemplate({ file, scriptPath: filesRuntimes[i] })
                .on('error', reject)
                .pipe(fs.createWriteStream(htmlOutput))
                .on('error', reject)
                .on('finish', () => resolve())
            })
          ),
          loadJSON(metaJSON).catch(err => {
            if (err.code === 'ENOENT') return {}
            throw err
          })
        ])
      })
    )
  )
}
