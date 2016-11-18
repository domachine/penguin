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
      .then(rawContent => {
        const $ =
          renderer
            ? renderer(cheerio.load(rawContent))
            : cheerio.load(rawContent)
        // const $ = cheerio.load(content)
        $('body').attr('data-penguin-signature', JSON.stringify(signature))
        return $.html()
      })
  }
}
