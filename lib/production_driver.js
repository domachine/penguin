'use strict'

const { createReadStream, readFile } = require('fs')
const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')
const Bluebird = require('bluebird')

const readFileAsync = Bluebird.promisify(readFile)

module.exports = ({
  staticPrefix = 'static',
  filesPrefix = 'files'
}) => {
  return ({
    index (res, next) {
      return createReadStream(join(filesPrefix, 'index.html'))
    },

    page: name => readFileAsync(`pages/${name}.html`),

    object: type => readFileAsync(`objects/${type}.html`),

    meta (path) {
      return readJSON(path + '.json').catch(() => ({}))
    },

    error (err, req, res, next) {
      if (err.statusCode === 404) {
        res.status(404).sendFile('404.html', { root: filesPrefix })
      } else {
        next(err)
      }
    },
    static: express.static(join(process.cwd(), staticPrefix))
  })
}
