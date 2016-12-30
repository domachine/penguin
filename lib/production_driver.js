'use strict'

const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')

module.exports = ({
  templatePrefix = 'dist',
  staticPrefix = 'static',
  filesPrefix = 'files'
}) => {
  return ({
    index (res, next) {
      res.sendFile('index.html', { root: filesPrefix })
    },

    page ({ params }, res, next) {
      const page = params.page || 'index'
      res.sendFile(`pages/${page}.html`, { root: templatePrefix })
    },

    object ({ databaseDriver, params }, res, next) {
      const { type } = params
      res.sendFile(`objects/${type}.html`, { root: templatePrefix })
    },

    meta ({ params: { path } }) {
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
