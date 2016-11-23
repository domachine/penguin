export default function createStateSerializer ({ config, language }) {
  return function dataToState ({ website, meta, record }) {
    const [globalFields, globalNoLangFields] = (config.globalFields || [])
      .reduce(
        ([fields, noLangFields], key) => {
          const fieldName = typeof key === 'string' ? key : key[0]
          const opts = (typeof key === 'string' ? null : key[1]) || {}
          const newFields = Object.assign({}, fields, {
            [fieldName]: website.fields[fieldName] || null
          })
          const newNoLangFields =
            opts.noLang ? noLangFields.concat([fieldName]) : noLangFields
          return [newFields, newNoLangFields]
        },
        [{}, []]
      )
    return {
      locals: Object.assign({ noLangFields: [] }, meta, { fields: record.fields }),
      globals: { noLangFields: globalNoLangFields, fields: globalFields },
      languages: config.languages,
      currentLanguage: language || config.languages[0]
    }
  }
}
