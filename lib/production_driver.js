'use strict'

const { existsSync } = require('fs')
const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')

module.exports = ({ prefix = 'docs' }) => {
  const hasNotFoundPage = existsSync(join(prefix, '404.html'))
  const errorHandler = createErrorHandler({ prefix, hasNotFoundPage })
  return ({
    index (res, next) {
      res.sendFile('index.html', { root: prefix },
        errorHandler.bind(null, res, next))
    },

    page ({ params }, res, next) {
      const page = params.page || 'index'
      res.sendFile(`pages/${page}.html`, { root: prefix },
        errorHandler.bind(null, res, next))
    },

    object ({ databaseDriver, params }, res, next) {
      const { type } = params
      res.sendFile(`objects/${type}.html`, { root: prefix },
        errorHandler.bind(null, res, next))
    },

    meta ({ params: { path } }) {
      return readJSON(path + '.json').catch(() => ({}))
    },
    static: express.static(join(process.cwd(), join(prefix, 'static')))
  })
}

function createErrorHandler ({ prefix, hasNotFoundPage }) {
  return (res, next, err) => {
    if (!hasNotFoundPage) return next(err)
    res.sendFile('404.html', { root: prefix })
  }
}
