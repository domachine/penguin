'use strict'

export default function dataToState ({ website, meta, record, language }) {
  const globalFields = (website.fieldKeys || [])
    .reduce(
      (fields, key) =>
        Object.assign({}, fields, { [key]: website.fields[key] || null }),
      {}
    )
  return {
    locals: Object.assign({ noLangFields: [] }, meta, { fields: record.fields }),
    globals: { noLangFields: website.noLangFields, fields: globalFields },
    defaultLanguage: website.defaultLanguage,
    languages: website.languages,
    currentLanguage: language || website.defaultLanguage || website.languages[0]
  }
}
