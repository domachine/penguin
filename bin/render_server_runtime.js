#!/usr/bin/env node

'use strict'

const { Transform } = require('stream')
const cheerio = require('cheerio')

module.exports = render

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const pkgName = args['pkg-name']
  process.stdin
    .pipe(render({ pkgName }))
    .pipe(process.stdout)
}

function render ({ pkgName = 'penguin.js' } = {}) {
  let buffer = ''
  return new Transform({
    transform (chunk, enc, callback) {
      buffer += chunk
      callback()
    },
    flush (callback) {
      const $ = cheerio.load(buffer)
      const componentSet = new Set()
      $('[data-component]').each(function () {
        const name = $(this).attr('data-component')
        componentSet.add(name)
      })
      const components = [...componentSet]
      const code =
`${components.length > 0 ? `import createServerRuntime from '${pkgName}/lib/server_runtime'` : ''}
${components.length > 0 ? `import { ${components.join(', ')} } from '../.penguin/server_components'` : ''}
export default ${components.length > 0
  ? `createServerRuntime({ components: { ${components.join(', ')} } })`
  : `function noop (state, $) { return $ }`
}`
      this.push(code)
      callback()
    }
  })
}
