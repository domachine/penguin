import 'whatwg-fetch'
import 'babel-polyfill'
import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import reduce from './reducers'
import { loadState } from '../actions'

export default function createClientRuntime ({ components, stateLoader }) {
  let isMounted = false
  const isBuilt = !!document.body.getAttribute('data-penguin-built')
  const middleware =
    window.devToolsExtension ? window.devToolsExtension() : f => f
  const els = document.querySelectorAll('[data-component]')
  const { pathname } = window.location
  const initialState = { isBuilt, isEditable: !isBuilt, isLoading: !isBuilt }
  const storeEnhancer = compose(applyMiddleware(thunk), middleware)
  const store = createStore(reduce, initialState, storeEnhancer)
  return function run () {
    // Mount editing mode
    if (!store.getState().isBuilt) mountComponents()
    store.dispatch(loadState({ stateLoader, pathname }))
      .then(() => {
        // Mount built mode
        if (store.getState().isBuilt) mountComponents()
      })
  }

  function mountComponents () {
    if (isMounted) return
    for (let el of els) {
      const name = el.getAttribute('data-component')
      const component = components[name]
      if (!component) {
        el.innerHTML = `Unable to resolve component '${name}'`
        continue
      }
      const propsStr = decodeURIComponent(el.getAttribute('data-props') || '{}')
      const props = Object.assign({}, JSON.parse(propsStr), { store })
      component(props, el)
    }
    isMounted = true
  }
}
