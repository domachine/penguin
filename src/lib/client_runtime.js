import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import { SAVE, SAVE_FAILURE, SAVE_SUCCESS } from '../actions'
import {
  globalFields,
  globalNoLangFields,
  localFields,
  localNoLangFields
} from '../selectors'
import reduce from './reducers'

export default function createClientRuntime ({ components }) {
  let isMounted = false
  const middleware =
    window.devToolsExtension ? window.devToolsExtension() : f => f
  const els = document.querySelectorAll('[data-component]')
  return function run (state) {
    // Mount editing mode
    if (isMounted) return
    const hooks = []
    const storeEnhancer = compose(applyMiddleware(thunk), middleware)
    const store = createStore(reduce, state, storeEnhancer)
    ;[].slice.call(els).forEach(el => {
      const name = el.getAttribute('data-component')
      const component = components[name]
      if (!component) {
        el.innerHTML = `Unable to resolve component '${name}'`
      } else {
        const propsStr = decodeURIComponent(el.getAttribute('data-props') || '{}')
        const props = Object.assign({}, JSON.parse(propsStr), {
          store,
          save (callback) {
            hooks
              .filter(h => h && typeof h.save === 'function')
              .forEach(h => h.save())
            save(store, callback)
          },
          destroy (callback) {
            hooks
              .filter(h => h && typeof h.destroy === 'function')
              .forEach(h => h.destroy())
            destroy(store, callback)
          }
        })
        hooks.push(component(props, el))
      }
    })
    isMounted = true
  }
}

function save (store, callback = () => {}) {
  const put = (url, o, done) => {
    const xhr = new window.XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.onerror = () => done(xhr)
    xhr.onload = () => {
      if ((xhr.status / 100 | 0) !== 2) return done(xhr)
      done(null, xhr)
    }
    xhr.send(JSON.stringify(o))
  }
  const saveFields = (pathname, data, { noLang, language }, done) => {
    const notLocalized =
      Object.keys(data)
        .reduce((fields, key) =>
          noLang.indexOf(key) > -1
            ? Object.assign({}, fields, { [key]: data[key] })
            : fields
        , {})
    const localized =
      Object.keys(data)
        .reduce((fields, key) =>
          noLang.indexOf(key) === -1
            ? Object.assign({}, fields, { [key]: data[key] })
            : fields
        , {})
    let pending = 2
    const sync = (err, xhr) => {
      if (err) { pending = 0; return done(err) }
      if (--pending === 0) done(null)
    }
    put(`/not_localized${pathname}.json`, notLocalized, sync)
    put(`/${language}${pathname}.json`, localized, sync)
  }
  const state = store.getState()
  const parts = window.location.pathname.split('/').slice(1)
  const language = parts[0]
  const pathname = '/' + parts.slice(1).join('/')
  store.dispatch({ type: SAVE })
  let pending = 2
  const sync = err => {
    if (err) {
      pending = 0
      callback(err)
      return ({ type: SAVE_FAILURE, error: err })
    }
    if (--pending === 0) {
      callback()
      store.dispatch({ type: SAVE_SUCCESS })
    }
  }
  saveFields('', globalFields(state), {
    noLang: globalNoLangFields(state),
    language
  }, sync)
  saveFields(pathname, localFields(state), {
    noLang: localNoLangFields(state),
    language
  }, sync)
}

function destroy (store, callback = () => {}) {
  const parts = window.location.pathname.split('/').slice(1)
  if (parts.length < 3) return
  const xhr = new window.XMLHttpRequest()
  xhr.open('DELETE', '/' + parts.slice(1).join('/'), true)
  xhr.onerror = () => store.dispatch({ SAVE_FAILURE, error: xhr })
  xhr.onload = () => {
    if ((xhr.status / 100 | 0) !== 2) {
      callback(xhr)
      return store.dispatch({ type: SAVE_FAILURE, error: xhr })
    }
    callback()
    store.dispatch({ type: SAVE_SUCCESS })
  }
  store.dispatch({ type: SAVE })
  xhr.send()
}
