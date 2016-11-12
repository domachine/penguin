'use strict'

const express = require('express')

module.exports = createApp

function createApp ({ engine, ext }) {
  const app = express()
  registerEngine(app, ext, engine)
  app.set('views', process.cwd())
  app.get('/:page?', (req, res, next) => {
    if (req.params.page === 'favicon.ico') return next()
    const page = req.params.page || 'index'
    res.render(`pages/${page}`)
  })
  app.get('/:type/:id', (req, res) => {
    res.render(`objects/${req.params.type}`)
  })
  return app
}

function registerEngine (app, ext, engine) {
  app.engine(ext, (filepath, options, callback) => {
    engine(filepath.split('.').slice(0, -1).join('.'), options)
      .then(c => callback(null, c), callback)
  })
  app.set('view engine', ext)
}
