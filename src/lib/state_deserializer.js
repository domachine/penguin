export default function createStateDeserializer ({ website, record }) {
  return function stateToData ({ state }) {
    return {
      website: Object.assign({}, website, {
        fields: state.globals.fields
      }),
      record: Object.assign({}, record, {
        fields: state.locals.fields
      })
    }
  }
}
