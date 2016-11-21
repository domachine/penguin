import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import 'whatwg-fetch'
import 'babel-polyfill'
import reduce from './reducers'
import { loadState } from './actions'

export default function render ({ components }) {
  const signature =
    JSON.parse(document.body.getAttribute('data-penguin-signature'))
  const splittedLocation = window.location.href.split('/')
  const language = splittedLocation[1]
  const middleware =
    compose(
      applyMiddleware(thunk),
      window.devToolsExtension ? window.devToolsExtension() : f => f
    )
  const store = createStore(reduce, {
    isEditable: !document.body.getAttribute('data-penguin-built'),
    isLoading: !document.body.getAttribute('data-penguin-built')
  }, middleware)
  const els = document.querySelectorAll('[data-component]')
  store.dispatch(loadState({
    type: signature[0],
    template: signature[1],
    objectType: splittedLocation.filter(s => !!s).slice(0, -2)[0],
    id: splittedLocation.filter(s => !!s).slice(0, -1)[0],
    language
  }))
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
