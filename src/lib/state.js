'use strict'

export default ({ config }) => {
  const {
    keys: globalKeys,
    notLocalized: globalNotLocalized
  } = parseKeyConfig(config.globals)
  return ({ fields, meta, language }) =>
    ({
      fields,
      locals: { notLocalized: parseKeyConfig(meta.keys).notLocalized },
      globals: {
        keys: globalKeys,
        notLocalized: globalNotLocalized
      },
      languages: config.languages
    })
}

function parseKeyConfig (cfg = []) {
  const keys = cfg
    .map(field => typeof field === 'string' ? field : field[0])
  const notLocalized = cfg
    .reduce(
      (noLangFields, key) => {
        const fieldName = typeof key === 'string' ? key : key[0]
        const opts = (typeof key === 'string' ? null : key[1]) || {}
        const localized = opts.localized == null ? true : opts.localized
        return !localized ? noLangFields.concat([fieldName]) : noLangFields
      },
      []
    )
  return { keys, notLocalized }
}
