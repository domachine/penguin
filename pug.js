'use strict'

module.exports = createPugEngine

function createPugEngine () {
  const pug = require('pug')
  const opts = { basedir: process.cwd() }
  return source => pug.render(source, opts)
}
