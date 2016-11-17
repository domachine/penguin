import { createStore } from 'redux'

import reduce from './reducers'

export default function render (component, { props, state }) {
  const store = createStore(reduce, state)
  return component(Object.assign({}, props, { store }))
}
