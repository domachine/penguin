'use strict'

const { mkdtemp } = require('fs')
const express = require('express')
const bodyParser = require('body-parser').json
const rimraf = require('rimraf')
const Bluebird = require('bluebird')
const createError = require('http-errors')

const build = require('../bin/build')

const rimrafAsync = Bluebird.promisify(rimraf)

module.exports = createApp

function createApp ({
  tmpPrefix = 'penguin-build-',
  prefix,
  runtime,
  viewDriver,
  databaseDriver,
  publishDriver,
  languages,
  middleware = []
}) {
  const langIndex = new Set(languages)
  const app = express()
  app.use((req, res, next) => {
    res.renderPage = params => viewDriver.page({ params }, res, next)
    res.renderObject = params =>
      viewDriver.object({ databaseDriver, params }, res, next)
    next()
  })
  middleware.forEach(m => app.use(m))
  app.use('/static', viewDriver.static)
  app.use(/^\/(objects|pages)\/([^/]+).json$/, (req, res, next) => {
    const path = req.params[0] + '/' + req.params[1]
    viewDriver.meta({ params: { path } }).then(o => res.send(o), next)
  })
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
  app.get('/:language/:name.json', (req, res, next) => {
    const { language, name } = req.params
    if (!langIndex.has(language)) return next(createError(404))
    Promise.all([
      language !== languages[0]
        ? databaseDriver.getPage({ language: languages[0], name })
        : Promise.resolve({}),
      databaseDriver.getPage({ language, name }),
      databaseDriver.getPage({ language: null, name }),
      databaseDriver.getGlobals({ language }),
      databaseDriver.getGlobals({ language: null })
    ])
    .then(fields => {
      res.send(Object.assign({}, ...fields))
    })
  })
  app.get('/:language/:type/:id.json', (req, res, next) => {
    const { language, type, id } = req.params
    if (!langIndex.has(language)) return next(createError(404))
    Promise.all([
      language !== languages[0]
        ? databaseDriver.getObject({ language: languages[0], type, id })
        : Promise.resolve({}),
      databaseDriver.getObject({ language, type, id }),
      databaseDriver.getObject({ language: null, type, id }),
      databaseDriver.getGlobals({ language }),
      databaseDriver.getGlobals({ language: null })
    ])
    .then(fields => {
      res.send(Object.assign({}, ...fields))
    })
  })
  app.get('/', (req, res, next) => viewDriver.index(res, next))
  app.get('/:language/:page?', (req, res, next) => {
    const { params } = req
    if (!langIndex.has(params.language)) return next(createError(404))
    viewDriver.page({ params }, res, next)
  })
  app.get('/:language/:type/:id', (req, res, next) => {
    const { params } = req
    if (!langIndex.has(params.language)) return next(createError(404))
    viewDriver.object({ databaseDriver, params }, res, next)
  })
  if (publishDriver) {
    app.post('/api/v1/publish', (req, res, next) => {
      mkdtemp(tmpPrefix, (err, output) => {
        if (err) return next(err)
        build({ runtime, databaseDriver, languages, prefix, output })
          .then(() => publishDriver(output))
          .then(() => rimrafAsync(output))
          .then(() => res.status(204).send())
          .catch(next)
      })
    })
  }
  if (viewDriver.error) app.use(viewDriver.error)
  return app
}
