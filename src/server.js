import { createStore } from 'redux'

import reduce from './reducers'
import dataToState from './lib/data_to_state'

export default function render (component, { props, data }) {
  const store = createStore(reduce, dataToState(data))
  return component(Object.assign({}, props, { store }))
}
