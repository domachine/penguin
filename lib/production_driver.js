'use strict'

const { createReadStream } = require('fs')
const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')

module.exports = ({
  staticPrefix = 'static',
  filesPrefix = 'files'
}) => {
  return ({
    index (res, next) {
      return createReadStream(join(filesPrefix, 'index.html'))
    },

    page (name) {
      return createReadStream(`pages/${name}.html`)
    },

    object (type) {
      return createReadStream(`objects/${type}.html`)
    },

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
