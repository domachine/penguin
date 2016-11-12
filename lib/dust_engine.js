'use strict'

const fs = require('fs')
const { resolve } = require('url')

module.exports = createDustRenderer

function createDustRenderer ({ assetPrefix = '' }) {
  const dust = require('dustjs-linkedin')
  dust.helpers.asset = asset
  dust.onLoad = onLoad
  return function render (name, opts = {}) {
    return new Promise((resolve, reject) => {
      dust.render(name, opts, (err, content) => {
        if (err) return reject(err)
        resolve(content)
      })
    })
  }

  function asset (chunk, context, bodies, params) {
    const path = params.path
    chunk.write(resolve(assetPrefix || '', path || ''))
  }

  function onLoad (templateName, opts, callback) {
    dust.cache = {}
    fs.readFile(templateName + '.html', 'utf8', callback)
  }
}
