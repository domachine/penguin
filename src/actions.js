import {
  globalFields,
  currentLanguage,
  localFields,
  localNoLangFields,
  globalNoLangFields
} from './selectors'

export const UPDATE_LOCAL_FIELDS = 'UPDATE_LOCAL_FIELDS'
export const UPDATE_GLOBAL_FIELDS = 'UPDATE_GLOBAL_FIELDS'
export const SET_EDITABLE = 'SET_EDITABLE'
export const SAVE = 'SAVE'
export const SAVE_SUCCESS = 'SAVE_SUCCESS'
export const SAVE_FAILURE = 'SAVE_FAILURE'
export const SWITCH_LANGUAGE = 'SWITCH_LANGUAGE'

export function updateLocalFields (update) {
  return { type: UPDATE_LOCAL_FIELDS, update }
}

export function updateGlobalFields (update) {
  return { type: UPDATE_GLOBAL_FIELDS, update }
}

export function update (update) {
  return (dispatch, getState) => {
    const state = getState()
    const globalKeys = Object.keys(globalFields(state))
    const updates = Object.keys(update)
      .map(key =>
        globalKeys.indexOf(key) !== -1
          ? { type: 'global', update: [key, update[key]] }
          : { type: 'local', update: [key, update[key]] }
      )
      .reduce(
        (updates, update) =>
          update.type === 'global'
            ? Object.assign({}, updates, {
              global: Object.assign({}, updates.global, {
                [update.update[0]]: update.update[1]
              })
            })
            : Object.assign({}, updates, {
              local: Object.assign({}, updates.local, {
                [update.update[0]]: update.update[1]
              })
            }),
        {}
      )
    if (updates.local) {
      const opts = {
        currentLanguage: currentLanguage(state),
        fields: localFields(state),
        noLangFields: localNoLangFields(state)
      }
      dispatch(updateLocalFields(spreadToLanguage(opts, updates.local)))
    }
    if (updates.global) {
      const opts = {
        currentLanguage: currentLanguage(state),
        fields: globalFields(state),
        noLangFields: globalNoLangFields(state)
      }
      dispatch(updateGlobalFields(spreadToLanguage(opts, updates.global)))
    }
  }
}

function spreadToLanguage ({ currentLanguage, noLangFields, fields }, update) {
  return Object.keys(update)
    .reduce(
      (updates, key) =>
        noLangFields.indexOf(key) === -1
          ? Object.assign({}, updates, {
            [key]: {
              values: Object.assign({}, (fields[key] || {}).values, {
                [currentLanguage]: update[key]
              })
            }
          })
          : Object.assign({}, updates, {
            [key]: {
              value: update[key]
            }
          }),
      {}
    )
}

export function setEditable (value) {
  return { type: SET_EDITABLE, value }
}

export function save () {
  return { type: SAVE }
}

export function saveSuccess () {
  return { type: SAVE_SUCCESS }
}

export function saveFailure () {
  return { type: SAVE_FAILURE }
}

export function switchLanguage (lang) {
  return { type: SWITCH_LANGUAGE, lang }
}
