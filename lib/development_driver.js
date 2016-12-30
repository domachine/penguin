'use strict'

const { existsSync } = require('fs')
const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')
const errorhandler = require('errorhandler')

const indexPage = require('../pages/index')
const page404 = require('../pages/404')

module.exports = createDevelopmentDriver

function createDevelopmentDriver ({
  engine,
  languages,
  ext,
  prefix,
  filesPrefix,
  staticPrefix
}) {
  const error = errorhandler()
  return {
    index (res, next) {
      res.sendFile('index.html', { root: filesPrefix }, (err) => {
        if (err && err.status === 404) res.send(indexPage({ languages }))
        else next(err)
      })
    },

    page ({ params }, res, next) {
      if (!languages.includes(params.language)) return serve404(res, next)
      const page = params.page || 'index'
      const p = join(prefix, `pages/${page}.${ext}`)
      if (!existsSync(p)) return serve404(res, next)
      render(res, p, next)
    },

    object ({ databaseDriver, params }, res, next) {
      const { language, type } = params
      if (!languages.includes(language)) return serve404(res, next)
      const p = join(prefix, `objects/${type}.${ext}`)
      if (!existsSync(p)) return serve404(res, next)
      render(res, p, next)
    },

    meta ({ params: { path } }) {
      return readJSON(path + '.json').catch(() => ({}))
    },

    error (err, req, res, next) {
      if (err.statusCode === 404) {
        serve404(res, err => error(err, req, res, next))
      } else {
        error(err, req, res, next)
      }
    },
    static: express.static(join(process.cwd(), staticPrefix))
  }

  function serve404 (res, next) {
    res.statusCode = 404
    res.sendFile('404.html', { root: filesPrefix }, (err) => {
      if (err && err.status === 404) res.end(page404())
      else if (err) return next(err)
    })
  }

  function render (res, filepath, callback) {
    engine(filepath)
      .then(c => {
        res.writeHead(200, {
          'Content-Type': 'text/html'
        })
        res.end(c)
      }, callback)
  }
}
