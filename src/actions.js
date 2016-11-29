import shortid from 'shortid'

import {
  globalFields,
  globalNoLangFields,
  currentLanguage,
  localFields,
  localNoLangFields
} from './selectors'

export const HYDRATE = 'HYDRATE'
export const UPDATE_FIELDS = 'UPDATE_FIELDS'
export const SET_EDITABLE = 'SET_EDITABLE'
export const LOAD = 'LOAD'
export const LOAD_SUCCESS = 'LOAD_SUCCESS'
export const LOAD_FAILURE = 'LOAD_FAILURE'
export const SAVE = 'SAVE'
export const SAVE_SUCCESS = 'SAVE_SUCCESS'
export const SAVE_FAILURE = 'SAVE_FAILURE'

export function loadState ({ stateLoader, pathname }) {
  return (dispatch, getState) => {
    dispatch({ type: LOAD, pathname })
    const { context: { isNew, match } } = getState()
    const promise =
      match.length === 4
        ? stateLoader.loadObjectState({
          language: match[1],
          type: match[2],
          id: match[3],
          isNew
        })
        : stateLoader.loadPageState({
          language: match[1],
          name: match[2] || 'index'
        })
    return promise
      .then(state => {
        dispatch({ type: HYDRATE, state })
        dispatch({ type: LOAD_SUCCESS })
      }, err => {
        dispatch({ type: LOAD_FAILURE, error: err })
      })
  }
}

export function update (update) {
  return { type: UPDATE_FIELDS, update }
}

export function setEditable (value) {
  return { type: SET_EDITABLE, value }
}

export function save () {
  return (dispatch, getState) => {
    const state = getState()
    if (state.isLoading) return
    const { isNew, match } = state.context
    const pathname =
      match[3] === 'new'
        ? `/${match[1]}/${match[2]}/${shortid()}`
        : ((match.length === 3 && !match[2])
          ? `/${match[1]}/index`
          : match[0])
    dispatch({ type: SAVE })
    return Promise.all([
      saveFields('', globalFields(state), {
        noLang: globalNoLangFields(state),
        language: currentLanguage(state)
      }),
      saveFields(pathname.replace(/^\/[^/]+\/?/, '/'), localFields(state), {
        noLang: localNoLangFields(state),
        language: currentLanguage(state)
      })
    ])
    .then(([website, record]) => {
      dispatch({ type: SAVE_SUCCESS })
      if (isNew) window.location.href = pathname
    }, err => {
      dispatch({ type: SAVE_FAILURE, error: err })
    })
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
