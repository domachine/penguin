'use strict'

const { existsSync } = require('fs')
const { join } = require('path')
const express = require('express')

module.exports = createApp

function createApp ({ engine, ext, staticPrefix }) {
  const app = express()
  registerEngine(app, ext, engine)
  app.set('views', process.cwd())
  app.use('/static', express.static(join(process.cwd(), staticPrefix)))
  app.get('/:page?', (req, res, next) => {
    if (req.params.page === 'favicon.ico') return next()
    const page = req.params.page || 'index'
    const p = join(app.get('views'), `pages/${page}.${ext}`)
    if (!existsSync(p)) return res.redirect('/404')
    res.render(`pages/${page}`, { signature: ['page', page] })
  })
  app.get('/:type/:id', (req, res) => {
    const p = join(app.get('views'), `objects/${req.params.type}.${ext}`)
    if (!existsSync(p)) return res.redirect('/404')
    res.render(`objects/${req.params.type}`, {
      signature: ['object', req.params.type]
    })
  })
  return app
}

function registerEngine (app, ext, engine) {
  app.engine(ext, (filepath, options, callback) => {
    engine(filepath, options)
      .then(c => callback(null, c), callback)
  })
  app.set('view engine', ext)
}
