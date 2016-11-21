'use strict'

const { dirname, extname, basename, join } = require('path')
const cheerio = require('cheerio')

module.exports = createEngine

function createEngine ({ drivers, driverParams = {}, renderer }) {
  const driverCache = {}
  const engine = render
  engine.drivers = drivers
  return engine

  function render (name, opts = {}) {
    const { signature } = opts
    delete opts.signature
    if (!signature) throw new Error('No signature given')
    const d = dirname(name)
    const e = extname(name)
    const b = basename(name, e)
    const viewEngine = e.slice(1)
    const driver =
      driverCache[viewEngine] ||
      (driverCache[viewEngine] = drivers[viewEngine](driverParams))
    if (!driver) return Promise.reject(new Error('No view driver found for ' + name))
    return driver(join(d, b), opts)
      .then(content => {
        const $ = cheerio.load(content)
        $('[data-component]').each(function () {
          const innerHTML = $(this).html()
          let props = JSON.parse($(this).attr('data-props') || '{}')
          Object.assign(props, { innerHTML: props.innerHTML || innerHTML })
          $(this).attr('data-props', JSON.stringify(props))
        })
        $('body').attr('data-penguin-signature', JSON.stringify(signature))
        return (renderer ? renderer($).html() : $.html())
      })
  }
}
