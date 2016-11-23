import 'whatwg-fetch'
import 'babel-polyfill'
import EventEmitter from 'events'
import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import reduce from './reducers'
import { HYDRATE, LOAD, LOAD_SUCCESS, LOAD_FAILURE } from '../actions'
import createPenguin from './penguin'

export default function createClientRuntime ({ components, domScanner, stateLoader }) {
  let isMounted = false
  const { signature, id, isBuilt, middleware, elements: els } = domScanner()
  const initialState = { isBuilt, isEditable: !isBuilt, isLoading: !isBuilt }
  const storeEnhancer = compose(applyMiddleware(thunk), middleware)
  const store = createStore(reduce, initialState, storeEnhancer)
  const penguinControl = new EventEmitter()
  const penguin = createPenguin({
    store,
    receiver: penguinControl,
    fetch: window.fetch
  })
  return function run () {
    // Mount editing mode
    if (!store.getState().isBuilt) mountComponents()
    store.dispatch({ type: LOAD })
    const promise =
      signature[0] === 'object'
        ? stateLoader.loadObjectState({ type: signature[1], id })
        : stateLoader.loadPageState({ name: id })
    promise
      .then(({ state, website, record }) => {
        const d = { website, [signature[0]]: record, id }
        penguinControl.emit('set data', d)
        store.dispatch({ type: HYDRATE, state })
        store.dispatch({ type: LOAD_SUCCESS })

        // Mount built mode
        if (state.isBuilt) mountComponents()
      }, err => {
        store.dispatch({ type: LOAD_FAILURE, error: err })
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
      const props = Object.assign({}, JSON.parse(propsStr), { store, penguin })
      component(props, el)
    }
    isMounted = true
  }
}
