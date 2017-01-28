import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import reduce from './reducers'

export default function createClientRuntime ({ components }) {
  let isMounted = false
  const middleware =
    window.devToolsExtension ? window.devToolsExtension() : f => f
  const els = document.querySelectorAll('[data-component]')
  return function run (state) {
    // Mount editing mode
    if (isMounted) return
    const storeEnhancer = compose(applyMiddleware(thunk), middleware)
    const store = createStore(reduce, state, storeEnhancer)
    ;[].slice.call(els).forEach(el => {
      const name = el.getAttribute('data-component')
      const component = components[name]
      if (!component) {
        el.innerHTML = `Unable to resolve component '${name}'`
      } else {
        const propsStr = decodeURIComponent(el.getAttribute('data-props') || '{}')
        const props = Object.assign({}, JSON.parse(propsStr), { store })
        component(props, el)
      }
    })
    isMounted = true
  }
}
