'use strict'

const fs = require('fs')
const { resolve } = require('url')
const escapeHTML = require('escape-html')

module.exports = createDustRenderer

function createDustRenderer ({ assetPrefix = '' }) {
  const dust = require('dustjs-linkedin')
  dust.helpers.asset = asset
  dust.helpers.component = component
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

  function component (chunk, context, bodies, params) {
    const props = params
    const name = props.name
    const tagName = props.tagName || 'div'
    delete props.name
    delete props.tagName
    chunk.write(
`<${tagName} \
data-component='${name}' \
data-props='${escapeHTML(JSON.stringify(props))}'></${tagName}>`
    )
  }

  function onLoad (templateName, opts, callback) {
    dust.cache = {}
    fs.readFile(templateName + '.html', 'utf8', (err, src) => {
      if (err) return callback(err)
      let compiled
      try {
        compiled = dust.compile(src, templateName)
      } catch (err) { return callback(err) }
      dust.loadSource(compiled)
      dust.render(templateName, opts, (err, out) => {
        if (err) return callback(err)
        callback(null, out)
      })
    })
  }
}
