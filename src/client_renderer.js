import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import 'whatwg-fetch'
import 'babel-polyfill'
import reduce from './reducers'
import { fetchAll } from './actions'

export default function render ({ components }) {
  const middleware =
    compose(
      applyMiddleware(thunk),
      window.devToolsExtension ? window.devToolsExtension() : f => f
    )
  const store = createStore(reduce, {
    isEditable: !document.body.getAttribute('data-penguin-built'),
    isFetching: !document.body.getAttribute('data-penguin-built')
  }, middleware)
  const els = document.querySelectorAll('[data-component]')
  store.dispatch(fetchAll())
  for (let el of els) {
    const name = el.getAttribute('data-component')
    const component = components[name]
    if (!component) {
      el.innerHTML = `Unable to resolve component '${name}'`
      continue
    }
    const propsStr = decodeURIComponent(el.getAttribute('data-props') || '{}')
    const additionalProps = { store }
    const props = Object.assign({}, JSON.parse(propsStr), additionalProps)
    component(props, el)
  }
}
