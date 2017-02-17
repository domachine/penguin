#!/usr/bin/env node

'use strict'

const cheerio = require('cheerio')

module.exports = (
  source,
  { driver, scriptPath, productionScriptPath } = {}
) => {
  if (driver) source = driver(source)
  const $ = cheerio.load(source)
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
  if (scriptPath) {
    $('body').append(`<script src='${scriptPath}'></script>`)
  }
  if (productionScriptPath) {
    $('body').append(`<!--${productionScriptPath}-->`)
  }
  return $.html()
}
