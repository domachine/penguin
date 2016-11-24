import { createSelector } from 'reselect'

export const localFields = createSelector(
  ({ locals: { fields } }) => fields,
  data => data || {}
)

export const globalFields = createSelector(
  ({ globals }) => globals,
  globals => (globals || {}).fields || {}
)

export const localNoLangFields = ({ locals: { noLangFields } }) => noLangFields
export const globalNoLangFields = ({ globals: { noLangFields } }) => noLangFields

export const currentLanguage = createSelector(
  ({ currentLanguage }) => currentLanguage,
  ({ languages }) => languages[0],
  (currentLanguage, defaultLanguage) => currentLanguage || defaultLanguage
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

export function createValueSelector () {
  return createSelector(
    localNoLangFields,
    globalNoLangFields,
    localFields,
    globalFields,
    currentLanguage,
    (state, name) => name,
    (
      localNoLangFields,
      globalNoLangFields,
      localFields,
      globalFields,
      currentLanguage,
      name
    ) => {
      const isGlobal = Object.keys(globalFields).indexOf(name) !== -1
      if (!currentLanguage) return
      return extractField(
        {
          currentLanguage,
          noLangFields: (isGlobal ? globalNoLangFields : localNoLangFields)
        },
        name,
        (isGlobal ? globalFields : localFields)[name]
      )
    }
  )
}

function extractField ({ currentLanguage, noLangFields }, name, field) {
  if (noLangFields.indexOf(name) === -1) {
    const values = (field || {}).values || {}
    return values[currentLanguage]
  } else {
    return (field || {}).value
  }
}
