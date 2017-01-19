'use strict'

module.exports = createClientRendererScript

function createClientRendererScript ({ name }) {
  return (
`import createClientRuntime from '${name}/lib/client_runtime.js'
import createStateSerializer from '${name}/lib/state_serializer'
import createStateLoader from '${name}/lib/client_state_loader'
import components from './components'
import { penguin as config } from './package.json'
const runtime = createClientRuntime({
  components,
  stateLoader: createStateLoader({
    fetch: window.fetch,
    stateSerializer: createStateSerializer({ config })
  })
})
runtime()
`
  )
}
