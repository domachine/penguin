'use strict'

const str = require('string-to-stream')

module.exports = createClientRendererScript

function createClientRendererScript ({ name }) {
  return str(
`import render from '${name}/client_renderer.js'
import createStateSerializer from '${name}/lib/state_serializer'
import components from './components'
import { penguin as config } from './package.json'
const language = window.location.pathname.split('/')[1]
render({
  components,
  stateSerializer: createStateSerializer({ config, language })
})
`
  )
}
