import {
  globalFields,
  globalNoLangFields,
  localFields,
  localNoLangFields
} from './selectors'

export const HYDRATE = 'HYDRATE'
export const UPDATE_FIELDS = 'UPDATE_FIELDS'
export const SET_EDITABLE = 'SET_EDITABLE'
export const SAVE = 'SAVE'
export const SAVE_SUCCESS = 'SAVE_SUCCESS'
export const SAVE_FAILURE = 'SAVE_FAILURE'

export function update (update) {
  return { type: UPDATE_FIELDS, update }
}

export function setEditable (value) {
  return { type: SET_EDITABLE, value }
}

export function save () {
  return (dispatch, getState) => {
    const state = getState()
    const parts = window.location.pathname.split('/').slice(1)
    const language = parts[0]
    const pathname = '/' + parts.slice(1).join('/')
    dispatch({ type: SAVE })
    return Promise.all([
      saveFields('', globalFields(state), {
        noLang: globalNoLangFields(state),
        language
      }),
      saveFields(pathname, localFields(state), {
        noLang: localNoLangFields(state),
        language
      })
    ])
    .then(
      ([website, record]) => dispatch({ type: SAVE_SUCCESS }),
      err => dispatch({ type: SAVE_FAILURE, error: err })
    )
  }
}

export function saveSuccess () {
  return { type: SAVE_SUCCESS }
}

export function saveFailure () {
  return { type: SAVE_FAILURE }
}

function saveFields (pathname, data, { noLang, language }) {
  const { notLocalized, translated } = spreadFields(data, { noLang })
  return Promise.all([
    window.fetch(`/not_localized${pathname}.json`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notLocalized)
    }),
    window.fetch(`/${language}${pathname}.json`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(translated)
    })
  ])
}

function spreadFields (data, { noLang }) {
  const notLocalized =
    Object.keys(data)
      .reduce((fields, key) =>
        noLang.indexOf(key) > -1
          ? Object.assign({}, fields, { [key]: data[key] })
          : fields
      , {})
  const translated =
    Object.keys(data)
      .reduce((fields, key) =>
        noLang.indexOf(key) === -1
          ? Object.assign({}, fields, { [key]: data[key] })
          : fields
      , {})
  return { notLocalized, translated }
}
