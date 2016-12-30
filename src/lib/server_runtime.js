import { createStore } from 'redux'

import reduce from './reducers'

export default function createServerRenderer ({ components, state }) {
  return function render ($) {
    const store = createStore(reduce, state)
    $('[data-component]').each(function () {
      const el = $(this)
      const component = components[el.attr('data-component')]
      if (!component) return
      const markupProps = JSON.parse((el.attr('data-props') || '{}'))
      const res = component(Object.assign({}, markupProps, { store }))
      if (typeof res === 'string') el.html(res)
      else if (typeof res.replace === 'string') el.replaceWith($(res.replace))
      else {
        if (typeof res.attrs === 'object') {
          for (let key of Object.keys(res.attrs)) {
            if (typeof res.attrs[key] !== 'string') continue
            el.attr(key, res.attrs[key])
          }
        }
      }
    })
    return $
  }
}
