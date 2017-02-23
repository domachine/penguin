'use strict'

const { mkdtemp } = require('fs')
const qs = require('querystring')
const express = require('express')
const bodyParser = require('body-parser').json
const rimraf = require('rimraf')
const Bluebird = require('bluebird')
const createError = require('http-errors')
const cheerio = require('cheerio')
const serialize = require('serialize-javascript')

const build = require('../bin/build')

const rimrafAsync = Bluebird.promisify(rimraf)

module.exports = startServer

function startServer ({
  tmpPrefix = 'penguin-build-',
  config,
  viewDriver,
  databaseDriver,
  publishDriver,
  languages,
  middleware = [],
  port = 3000
}) {
  const langIndex = new Set(languages)
  const app = express()
  middleware.forEach(m => app.use(m))
  app.use('/static', viewDriver.static)
  app.put('/:language.json', bodyParser(), (req, res, next) => {
    const language =
      req.params.language === 'not_localized' ? null : req.params.language
    if (language && !langIndex.has(language)) return res.sendStatus(400)
    databaseDriver.saveGlobals(req.body, { language })
      .then(() => res.send(req.body), next)
  })
  app.put('/:language/:name.json', bodyParser(), (req, res, next) => {
    const { name } = req.params
    const language =
      req.params.language === 'not_localized' ? null : req.params.language
    if (language && !langIndex.has(language)) return res.sendStatus(400)
    databaseDriver.savePage(req.body, { language, name })
      .then(() => res.send(req.body), next)
  })
  app.put('/:language/:type/:id.json', bodyParser(), (req, res, next) => {
    const { type, id } = req.params
    const language =
      req.params.language === 'not_localized' ? null : req.params.language
    if (language && !langIndex.has(language)) return res.sendStatus(400)
    databaseDriver.saveObject(req.body, { language, type, id })
      .then(() => res.send(req.body), next)
  })
  app.get('/', (req, res, next) => viewDriver.index().pipe(res))
  app.get('/:language', (req, res) => {
    const { language, query } = req.params
    const q = Object.keys(query || {}) > 0 ? `?${qs.stringify(query)}` : ''
    res.redirect(`/${language}/index${q}`)
  })
  app.get('/:language/:page', (req, res, next) => {
    const { params: { page: name, language } } = req
    if (!langIndex.has(language)) return next(createError(404))
    Promise.all([
      // viewDriver.page(name),
      Promise.all([
        language !== languages[0]
          ? databaseDriver.getPage({ language: languages[0], name })
          : Promise.resolve({}),
        databaseDriver.getPage({ language, name }),
        databaseDriver.getPage({ language: null, name }),
        databaseDriver.getGlobals({ language: languages[0] }),
        databaseDriver.getGlobals({ language }),
        databaseDriver.getGlobals({ language: null })
      ]),
      viewDriver.meta(`pages/${name}`)
    ])
    .then(([fieldss, meta]) => {
      const fields = Object.assign({}, ...fieldss)
      renderTemplate(res, viewDriver.page(name), { fields, meta, language }, next)
    }, next)
  })
  app.get('/:language/:type/:id', (req, res, next) => {
    const { params: { type, id, language } } = req
    if (!langIndex.has(language)) return next(createError(404))
    Promise.all([
      // viewDriver.object(type),
      Promise.all([
        language !== languages[0]
          ? databaseDriver.getObject({ language: languages[0], type, id })
          : Promise.resolve({}),
        databaseDriver.getObject({ language, type, id }),
        databaseDriver.getObject({ language: null, type, id }),
        databaseDriver.getGlobals({ language }),
        databaseDriver.getGlobals({ language: null })
      ]),
      viewDriver.meta(`objects/${type}`)
    ])
    .then(([fieldss, meta]) => {
      const fields = Object.assign({}, ...fieldss)
      renderTemplate(res, viewDriver.object(type), { fields, meta, language }, next)
    }, next)
  })
  app.delete('/:type/:id', (req, res, next) => {
    const { params: { type, id } } = req
    databaseDriver.destroyObject({ type, id })
      .then(() => res.send(), next)
  })
  if (publishDriver) {
    app.post('/api/v1/publish', (req, res, next) => {
      mkdtemp(tmpPrefix, (err, output) => {
        if (err) return next(err)
        const rm = () => rimrafAsync(output)
        build({ databaseDriver, config, output })
          .then(() => publishDriver(output))
          .then(rm, err => {
            const reject = () => Promise.reject(err)
            rm().then(reject, reject)
          })
          .then(() => res.status(204).send())
          .catch(next)
      })
    })
  }
  if (viewDriver.error) app.use(viewDriver.error)
  app.listen(port, () => {
    console.error('penguin: ready on port ' + port)
  })

  function renderTemplate (res, promise, { language, meta, fields }, next) {
    promise.then(code => {
      const $ = cheerio.load(code)
      const params = { config, fields, meta, language }
      $('body').append(
        `<script>window.Penguin(${
              serialize(params, { isJSON: true })
            })</script>`
      )
      res.send($.html())
    }, err => {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        return next(createError(404))
      }
      next(err)
    })
  }
}
