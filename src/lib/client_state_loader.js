// import 'whatwg-fetch'
// import 'babel-polyfill'

export default function createStateLoader ({ stateSerializer, fetch }) {
  return {
    loadObjectState ({ type, id }) {
      return load([
        loadWebsite(),
        loadTemplate('objects/' + type),
        id
          ? window.fetch(`/data/objects/${id}.json`)
          : Promise.resolve(() => ({ type, fields: {} }))
      ])
    },

    loadPageState ({ name }) {
      return load([
        loadWebsite(),
        loadTemplate('pages/' + name),
        window.fetch(`/data/pages/${name}.json`)
      ])
    }
  }

  function loadWebsite () {
    return fetch('/data/website.json', { credentials: 'same-origin' })
  }

  function loadTemplate (name) {
    return fetch(`/templates/${name}.json`)
  }

  function load (requests) {
    const promises = Promise.all(requests.map(p => p.then(res => res.json())))
    return promises.then(([website, { meta }, record]) =>
      stateSerializer({ website, meta, record })
    )
  }
}
