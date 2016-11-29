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

export const currentLanguage = createSelector(
  ({ context }) => context,
  context => context && context.language
)

export const languages = ({ languages }) => languages

export function isEditable ({ isEditable }) {
  return isEditable
}

export function isLoading ({ isLoading }) {
  return isLoading
}

export function isSaving ({ isSaving }) {
  return isSaving
}

export function isBuilt ({ isBuilt }) {
  return isBuilt
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
