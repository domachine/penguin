'use strict'

const { dirname, extname, basename, join } = require('path')
const cheerio = require('cheerio')

module.exports = createEngine

function createEngine ({ drivers, driverParams }) {
  const driverCache = {}
  const engine = render
  engine.drivers = drivers
  return engine

  function render (name, opts) {
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
          let props
          try {
            props = JSON.parse($(this).attr('data-props') || '{}')
          } catch (err) {
            console.log(err.stack)
            return
          }
          Object.assign(props, { innerHTML: props.innerHTML || innerHTML })
          $(this).attr('data-props', JSON.stringify(props))
          $(this).html('')
        })
        return $.html()
      })
  }
}
