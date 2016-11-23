export default function createDOMScanner ({ location, window }) {
  return function scan () {
    const signature =
      JSON.parse(window.document.body.getAttribute('data-penguin-signature'))
    const id =
      signature[0] === 'page'
        ? signature[1]
        : location.pathname.split('/').filter(s => !!s).slice(-1)[0]
    const isBuilt = !!document.body.getAttribute('data-penguin-built')
    const middleware =
      window.devToolsExtension ? window.devToolsExtension() : f => f
    const elements = document.querySelectorAll('[data-component]')
    return { id, isBuilt, signature, middleware, elements }
  }
}
