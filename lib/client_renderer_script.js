'use strict'

const str = require('string-to-stream')

module.exports = createClientRendererScript

function createClientRendererScript ({ name }) {
  return str(
`import { createStore } from 'redux'
import 'whatwg-fetch'
import 'babel-polyfill'
import reduce from '${name}/reducers'
import { fetchAll } from '${name}/actions'
import dataToState from '${name}/lib/data_to_state'

import components from './components'

const store = createStore(reduce, { isFetching: true })
const slice = Array.prototype.slice
const els = slice.call(document.querySelectorAll('[data-component]'))
store.dispatch(fetchAll())
els.forEach(el => {
  const component = components[el.getAttribute('data-component')]
  if (!component) return
  const propsStr = decodeURI(el.getAttribute('data-props') || '{}')
  const additionalProps = { store, innerHTML: el.innerHTML }
  const props = Object.assign({}, JSON.parse(propsStr), additionalProps)
  component(props, el)
})
`
  )
}
