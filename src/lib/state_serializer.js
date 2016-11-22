export default function createStateSerializer ({ config, language }) {
  return function dataToState ({ website, meta, record }) {
    const globalFields = (config.globalFields || [])
      .reduce(
        (fields, key) =>
          Object.assign({}, fields, { [key]: website.fields[key] || null }),
        {}
      )
    return {
      locals: Object.assign({ noLangFields: [] }, meta, { fields: record.fields }),
      globals: { noLangFields: website.noLangFields, fields: globalFields },
      defaultLanguage: config.languages[0],
      languages: config.languages,
      currentLanguage: language || config.languages[0]
    }
  }
}
