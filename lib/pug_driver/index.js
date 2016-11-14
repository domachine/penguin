'use strict'

const fs = require('fs')
const { resolve } = require('url')
const pkg = require('../../package.json')

module.exports = createPugEngine

function createPugEngine ({ assetPrefix = '' }) {
  const pug = require('pug')
  const includes = `include /node_modules/${pkg.name}/lib/pug_driver/mixins.pug\n`
  const opts = { basedir: process.cwd(), asset }
  return function render (name, output) {
    return new Promise((resolve, reject) => {
      let content
      try {
        content = includes + fs.readFileSync(name + '.pug', 'utf-8')
        content = pug.render(content, opts)
        resolve(content)
      } catch (err) { return reject(err) }
    })
  }

  function asset (path) {
    return resolve(assetPrefix, path || '')
  }
}
