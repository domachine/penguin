'use strict'

const str = require('string-to-stream')

module.exports = createClientRendererScript

function createClientRendererScript ({ name }) {
  return str(
`import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import 'whatwg-fetch'
import 'babel-polyfill'
import reduce from '${name}/reducers'
import { fetchAll } from '${name}/actions'
import dataToState from '${name}/lib/data_to_state'

import components from './components'

const middleware =
  compose(
    applyMiddleware(thunk),
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )
const store = createStore(reduce, { isFetching: true }, middleware)
const slice = Array.prototype.slice
const els = document.querySelectorAll('[data-component]')
store.dispatch(fetchAll())
for (let el of els) {
  const component = components[el.getAttribute('data-component')]
  if (!component) continue
  const propsStr = decodeURIComponent(el.getAttribute('data-props') || '{}')
  const additionalProps = { store }
  const props = Object.assign({}, JSON.parse(propsStr), additionalProps)
  component(props, el)
}
`
  )
}
