'use strict'

const { resolve } = require('url')

module.exports = createPugEngine

function createPugEngine ({ assetPrefix = '' }) {
  const pug = require('pug')
  return function render (name, output) {
    const content = pug.renderFile(name + '.pug', { asset })
    return Promise.resolve(content)
  }

  function asset (path) {
    return resolve(assetPrefix, path || '')
  }
}
