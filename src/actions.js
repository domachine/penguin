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
  return (dispatch, getState) => {
    const state = getState()
    const parts = window.location.pathname.split('/').slice(1)
    const language = parts[0]
    const pathname = '/' + parts.slice(1).join('/')
    dispatch({ type: SAVE })
    let pending = 2
    const sync = err => {
      if (err) {
        pending = 0
        return ({ type: SAVE_FAILURE, error: err })
      }
      if (--pending === 0) dispatch({ type: SAVE_SUCCESS })
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
}

export function saveSuccess () {
  return { type: SAVE_SUCCESS }
}

export function saveFailure () {
  return { type: SAVE_FAILURE }
}
