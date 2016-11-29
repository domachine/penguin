'use strict'

const { dirname, extname, basename, join } = require('path')
const cheerio = require('cheerio')

module.exports = createEngine

function createEngine ({ drivers, driverParams = {}, runtime }) {
  const driverCache = {}
  const engine = render
  engine.drivers = drivers
  return engine

  function render (name, opts = {}) {
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
          const tagName = $(this).get(0).tagName
          const className = $(this).attr('class')
          const id = $(this).attr('id')
          let props = JSON.parse($(this).attr('data-props') || '{}')
          Object.assign(props, {
            innerHTML: props.innerHTML || innerHTML,
            tagName: props.tagName || tagName,
            className: props.className || className,
            id: props.id || id
          })
          $(this).attr('data-props', JSON.stringify(props))
        })
        return (runtime ? runtime($).html() : $.html())
      })
  }
}
