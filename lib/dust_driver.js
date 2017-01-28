'use strict'

const fs = require('fs')
const escapeHTML = require('escape-html')

module.exports = createDustRenderer

function createDustRenderer () {
  const dust = require('dustjs-linkedin')
  dust.config.cache = false
  dust.helpers.component = component
  dust.helpers.link = link
  dust.onLoad = onLoad
  return function render (name, opts = {}) {
    return new Promise((resolve, reject) => {
      dust.render(name, opts, (err, content) => {
        if (err) return reject(err)
        resolve(content)
      })
    })
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
data-props='${escapeHTML(JSON.stringify(props))}'>`
    )
    if (bodies.block) chunk.render(bodies.block, context)
    chunk.write(`</${tagName}>`)
  }

  function link (chunk, context, bodies, params) {
    const props = params
    chunk.write(
`<a \
data-component='Link' \
data-props='${escapeHTML(JSON.stringify(props))}'>`
    )
    if (bodies.block) chunk.render(bodies.block, context)
    chunk.write(`</a>`)
  }

  function onLoad (templateName, opts, callback) {
    fs.readFile(templateName + '.dust', 'utf8', (err, src) => {
      if (err) return callback(err)
      let compiled
      try {
        compiled = dust.compile(src, templateName)
      } catch (err) { return callback(err) }
      callback(null, dust.loadSource(compiled))
    })
  }
}
