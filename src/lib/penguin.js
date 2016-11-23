import shortid from 'shortid'

import createStateDeserializer from './state_deserializer'
import { currentLanguage } from '../selectors'
import { SAVE, SAVE_SUCCESS, SAVE_FAILURE } from '../actions'

export default function createPenguin ({ store, receiver, fetch }) {
  let id = null
  let isObject = false
  let isNew = false
  let stateDeserializer = null
  receiver.on('set data', data => {
    const { website, id: _id } = data
    id = _id
    isObject = !!data.object
    isNew = isObject && _id === 'new'
    let record = data.object ? data.object : data.page
    stateDeserializer = createStateDeserializer({ website, record })
  })
  return {
    save () {
      if (!stateDeserializer) return
      const state = store.getState()
      const { website, record } = stateDeserializer({ state })
      const recordID = isNew ? shortid() : id
      store.dispatch({ type: SAVE })
      return Promise.all([
        saveWebsite(website),
        saveRecord(isObject ? 'objects' : 'pages', recordID, record)
      ])
      .then(([website, record]) => {
        store.dispatch({ type: SAVE_SUCCESS })
        if (isNew) {
          const lang = currentLanguage(state)
          window.location.href = `/${lang}/${record.type}/${recordID}`
        } else {
          stateDeserializer = createStateDeserializer({ website, record })
        }
      }, err => {
        store.dispatch({ type: SAVE_FAILURE, error: err })
      })
    }
  }

  function saveWebsite (data) {
    return fetch(`/data/website.json`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => res.json())
  }

  function saveRecord (collection, id, data) {
    return fetch(`/data/${collection}/${id}.json`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(res => res.json())
  }
}
