'use strict'

const vm = require('vm')
const co = require('co')
const cheerio = require('cheerio')

module.exports = createServerRenderer

function createServerRenderer ({ script }) {
  return co.wrap(
    function * render (html, output, { props, end = true }) {
      const $ = cheerio.load(html)
      $('[data-component]').each(function () {
        const el = $(this)
        const markupProps = JSON.parse((el.attr('data-props') || '{}'))
        markupProps.innerHTML = markupProps.innerHTML || el.html()
        const ctx = vm.createContext({
          __props: Object.assign({}, markupProps, props),
          __component: el.attr('data-component'),
          __output: {}
        })
        script.runInContext(ctx)
        el.html(ctx.__output.string)
      })
      output.write($.html())
      if (end) output.end()
    }
  )
}
