'use strict'

const { join } = require('path')
const mergeStream = require('merge-stream')
const ncp = require('ncp')
const Bluebird = require('bluebird')

const scanObjects = require('./scan_objects')
const scanPages = require('./scan_pages')
const completeRecords = require('./complete_records')
const renderHTML = require('./render_html')
const fsDriver = require('../fs')

module.exports = build

const ncpAsync = Bluebird.promisify(ncp)

function build (opts) {
  const { config } = opts
  const buildDir = opts.buildDir || opts.output || 'build'
  const databaseDriver = opts.databaseDriver || fsDriver({ prefix: 'data' })
  const { languages } = config
  const objects = scanObjects({ databaseDriver, languages })
  const pages = scanPages({ databaseDriver, languages })
  const complete = completeRecords({
    databaseDriver,
    defaultLanguage: languages[0]
  })
  const render = renderHTML({ databaseDriver, config, buildDir })
  return ncpAsync('files', buildDir)
    .then(() =>
      Promise.all([
        ncpAsync('static', join(buildDir, 'static')),
        new Promise((resolve, reject) => {
          mergeStream(objects, pages)
            .pipe(complete)
            .pipe(render)
            .on('error', reject)
            .on('finish', () => resolve())
        })
      ])
    )
    .then(() => {})  // Clear output
}
