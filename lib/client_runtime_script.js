'use strict'

const str = require('string-to-stream')

module.exports = createClientRendererScript

function createClientRendererScript ({ name }) {
  return str(
`import createClientRuntime from '${name}/lib/client_runtime.js'
import createStateSerializer from '${name}/lib/state_serializer'
import createDOMScanner from '${name}/lib/dom_scanner'
import createStateLoader from '${name}/lib/client_state_loader'
import components from './components'
import { penguin as config } from './package.json'
const language = window.location.pathname.split('/')[1]
const runtime = createClientRuntime({
  components,
  domScanner: createDOMScanner({ location: window.location, window }),
  stateLoader: createStateLoader({
    fetch: window.fetch,
    stateSerializer: createStateSerializer({ config, language })
  })
})
runtime()
`
  )
}
