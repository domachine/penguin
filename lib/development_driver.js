'use strict'

const { existsSync, createReadStream } = require('fs')
const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')
const errorhandler = require('errorhandler')
const str = require('string-to-stream')

const page404 = require('../pages/404')
const indexPage = require('../pages/index')
const compileTemplate = require('../bin/compile_template')

module.exports = createDevelopmentDriver

function createDevelopmentDriver ({
  templateCompiler,
  languages,
  ext,
  prefix,
  filesPrefix,
  staticPrefix
}) {
  const error = errorhandler()
  return {
    index () {
      const path = join(filesPrefix, 'index.html')
      if (!existsSync(path)) return str(indexPage({ languages }))
      return createReadStream(path)
    },

    page (name) {
      return compileTemplate({
        file: join(prefix, `pages/${name}.${ext}`),
        scriptPath: `/static/pages/${name}.${ext}`,
        templateCompiler
      })
    },

    object (type) {
      return compileTemplate({
        file: join(prefix, `objects/${type}.${ext}`),
        scriptPath: `/static/objects/${type}.${ext}`,
        templateCompiler
      })
    },

    meta (path) {
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
}
