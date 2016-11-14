'use strict'

const vm = require('vm')
const co = require('co')
const cheerio = require('cheerio')

module.exports = createServerRenderer

function createServerRenderer ({ script }) {
  return co.wrap(
    function * render (html, output, { props, data, end = true }) {
      const $ = cheerio.load(html)
      $('[data-component]').each(function () {
        const el = $(this)
        const markupProps = JSON.parse((el.attr('data-props') || '{}'))
        const ctx = vm.createContext({
          __params: {
            component: el.attr('data-component'),
            props: Object.assign({}, markupProps, props),
            data
          }
        })
        script.runInContext(ctx)
        el.html(ctx.__params.output)
      })
      output.write($.html())
      if (end) output.end()
    }
  )
}
