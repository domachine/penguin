'use strict'

const fs = require('fs')
const { join } = require('path')

module.exports = createDustRenderer

function createDustRenderer () {
  const dust = require('dustjs-linkedin')
  dust.helpers.asset = asset
  dust.onLoad = onLoad
  return function render (name, output) {
    return new Promise((resolve, reject) => {
      dust.render(name, output, (err, content) => {
        if (err) return reject(err)
        fs.writeFile(output, content, err => err ? reject(err) : resolve())
      })
    })
  }

  function asset (chunk, context, bodies, params) {
    const path = params.path
    chunk.write(join(process.env.ASSET_PREFIX || '', path || ''))
  }

  function onLoad (templateName, opts, callback) {
    fs.readFile(templateName + '.html', 'utf8', callback)
  }
}
