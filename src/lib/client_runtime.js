import 'whatwg-fetch'
import 'babel-polyfill'
import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import reduce from './reducers'
import { HYDRATE, SET_LOADING } from '../actions'

export default function createClientRuntime ({ components, domScanner, stateLoader }) {
  let isMounted = false
  const { signature, id, isBuilt, middleware, elements: els } = domScanner()
  const initialState = { isBuilt, isEditable: !isBuilt, isLoading: !isBuilt }
  const storeEnhancer = compose(applyMiddleware(thunk), middleware)
  const store = createStore(reduce, initialState, storeEnhancer)
  return function run () {
    // Mount editing mode
    if (!store.getState().isBuilt) mountComponents()
    store.dispatch({ type: SET_LOADING, value: true })
    const promise =
      signature[0] === 'object'
        ? stateLoader.loadObjectState({ type: signature[1], id })
        : stateLoader.loadPageState({ name: id })
    promise
      .then(state => {
        store.dispatch({ type: HYDRATE, state })
        store.dispatch({ type: SET_LOADING, value: false })

        // Mount built mode
        if (state.isBuilt) mountComponents()
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
