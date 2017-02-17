import { createSelector } from 'reselect'

export const localFields = createSelector(
  ({ fields }) => fields,
  globalKeys,
  (fields, globalKeys) =>
    Object.keys(fields)
      .reduce((localFields, key) =>
        globalKeys.indexOf(key) === -1
          ? Object.assign({}, localFields, { [key]: fields[key] })
          : localFields
      , {})
)

export const globalFields = createSelector(
  ({ fields }) => fields,
  globalKeys,
  (fields, globalKeys) =>
    Object.keys(fields)
      .reduce((globalFields, key) =>
        globalKeys.indexOf(key) > -1
          ? Object.assign({}, globalFields, { [key]: fields[key] })
          : globalFields
      , {})
)

export const localNoLangFields = ({ locals: { notLocalized } }) => notLocalized
export const globalNoLangFields = ({ globals: { notLocalized } }) => notLocalized

export const languages = ({ languages }) => languages

export function isSaving ({ isSaving }) {
  return isSaving
}

export function error ({ error }) {
  return error
}

export function globalKeys ({ globals: { keys } }) {
  return keys
}

export function createValueSelector () {
  return createSelector(
    ({ fields }) => fields,
    (state, name) => name,
    (fields, name) => fields[name]
  )
}
