export default function createStateSerializer ({ config }) {
  const {
    keys: globalKeys,
    notLocalized: globalNotLocalized
  } = parseKeyConfig(config.globals)
  return function dataToState ({ fields, meta, language }) {
    return {
      fields,
      locals: { notLocalized: parseKeyConfig(meta.keys).notLocalized },
      globals: {
        keys: globalKeys,
        notLocalized: globalNotLocalized
      },
      languages: config.languages,
      currentLanguage: language || config.languages[0]
    }
  }
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
