export default function createStateLoader ({ stateSerializer, fetch }) {
  return {
    loadObjectState ({ language, type, id, isNew }) {
      return load([
        loadJSON(`/objects/${type}.json`),
        loadJSON(`/${language}/${type}/${id}.json`)
      ])
    },

    loadPageState ({ language, name }) {
      return load([
        loadJSON(`/pages/${name}.json`),
        loadJSON(`/${language}/${name}.json`)
      ])
    }
  }

  function loadJSON (path) {
    return fetch(path, { credentials: 'same-origin' })
      .then(res => res.json())
  }

  function load (requests) {
    const promises = Promise.all(requests)
    return promises.then(([meta, fields]) =>
      stateSerializer({ meta, fields })
    )
  }
}
