import { createStore } from 'redux'

import reduce from './reducers'
import dataToState from './lib/data_to_state'

export default function render (component, { props, data }) {
  const state = Object.assign({}, dataToState(data), { isEditable: false })
  const store = createStore(reduce, state)
  return component(Object.assign({}, props, { store }))
}
