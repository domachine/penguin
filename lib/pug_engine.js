'use strict'

const fs = require('fs')
const { join } = require('path')

module.exports = createPugEngine

function createPugEngine () {
  const pug = require('pug')
  return function render (name, output) {
    const content = pug.renderFile(name + '.pug', { asset })
    return new Promise((resolve, reject) => {
      fs.writeFile(output, content, err => err ? reject(err) : resolve())
    })
  }

  function asset (path) {
    return join(process.env.ASSET_PREFIX || '', path || '')
  }
}
