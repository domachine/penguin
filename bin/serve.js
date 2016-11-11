#!/usr/bin/env node

'use strict'

const express = require('express')
const minimist = require('minimist')

const args = minimist(process.argv.slice(2))
const app = express()
registerEngine(app, args['view-engine'] || args.v || 'html')
app.set('views', process.cwd())
app.get('/:page?', (req, res) => {
  const page = req.params.page || 'index'
  res.render(`pages/${page}`)
})
app.get('/:type/:id', (req, res) => {
  res.render(`objects/${req.params.type}`)
})
app.listen(process.env.PORT || 3000, () => {
  console.log('> Ready on port ' + (process.env.PORT || 3000))
})

function registerEngine (app, engine) {
  switch (engine) {
    case 'html':
      app.engine('html', require('adaro').dust({ cache: false }))
      break
  }
  app.set('view engine', engine)
}
