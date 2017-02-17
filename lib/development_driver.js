'use strict'

const { existsSync, createReadStream, readFile } = require('fs')
const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')
const errorhandler = require('errorhandler')
const str = require('string-to-stream')
const Bluebird = require('bluebird')

const page404 = require('../pages/404')
const indexPage = require('../pages/index')
const compileTemplate = require('../lib/penguin_template')

const readFileAsync = Bluebird.promisify(readFile)

module.exports = createDevelopmentDriver

const drivers = {
  pug: require('../pug')
}

function createDevelopmentDriver ({
  templateCompiler,
  languages,
  ext,
  prefix,
  filesPrefix,
  staticPrefix
}) {
  const error = errorhandler()
  const driver = drivers[ext]
  return {
    index () {
      const path = join(filesPrefix, 'index.html')
      if (!existsSync(path)) return str(indexPage({ languages }))
      return createReadStream(path)
    },

    page: name =>
      readFileAsync(join(prefix, `pages/${name}.${ext}`)).then(source =>
        compileTemplate(source, {
          scriptPath: `/static/pages/${name}.${ext}`,
          driver: driver ? driver() : null
        })
      ),

    object: type =>
      readFileAsync(join(prefix, `objects/${type}.${ext}`)).then(source =>
        compileTemplate(source, {
          scriptPath: `/static/objects/${type}.${ext}`,
          driver: driver ? driver() : null
        })
      ),

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
