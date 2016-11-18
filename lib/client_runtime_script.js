'use strict'

const str = require('string-to-stream')

module.exports = createClientRendererScript

function createClientRendererScript ({ name }) {
  return str(
`import render from '${name}/client.js'
import components from './components'
render({ components })
`
  )
}
