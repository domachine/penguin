#!/usr/bin/env node

'use strict'

const { extname } = require('path')
const { Readable } = require('stream')
const cheerio = require('cheerio')

module.exports = compileTemplate

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const file = args._[0]
  if (!file) return error('No file given (e.g. myfile.html)')
  return compileTemplate({ file })
    .pipe(process.stdout)
}

function compileTemplate ({ file, runtime, scriptPath }) {
  const drivers = {
    '.dust': require('../lib/dust_driver'),
    '.pug': require('../lib/pug_driver')
  }
  const ext = extname(file)
  const driver = drivers[ext]
  if (!driver) throw new Error('Invalid file extension')
  const templateCompiler = driver()
  let ended = false
  return new Readable({
    read () {
      if (ended) return this.push(null)
      templateCompiler(file.split('.').slice(0, -1).join('.'))
        .then(code => {
          const $ = cheerio.load(code)
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
          ended = true
          this.push($.html())
        }, err => this.emit('error', err))
    }
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}
