'use strict'

const fs = require('fs')

module.exports = createPugEngine

function createPugEngine () {
  const pug = require('pug')
  const opts = { basedir: process.cwd() }
  return function render (name, output) {
    return new Promise((resolve, reject) => {
      let content
      try {
        content = fs.readFileSync(name + '.pug', 'utf-8')
        content = pug.render(content, opts)
        resolve(content)
      } catch (err) { return reject(err) }
    })
  }
}
