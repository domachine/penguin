#!/usr/bin/env node

'use strict'

const { Transform, PassThrough } = require('stream')
const { extname } = require('path')
const browserify = require('browserify')
const envify = require('envify')
const UglifyJS = require('uglify-js')
const rollupify = require('rollupify')

const renderClientRuntime = require('./render_client_runtime')
const compileTemplate = require('./compile_template')

module.exports = buildClientRuntime
process.env.NODE_ENV = 'production'

if (require.main === module) {
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const file = args._[0]
  if (!file) return error('penguin: no file given (e.g. myfile.html)')
  return buildClientRuntime({ file })
    .pipe(process.stdout)
}

function buildClientRuntime ({ file }) {
  const ext = extname(file)
  const rollupOpts = {
    config: {
      external: id => !id.startsWith('./') && !id.startsWith('/') && !id.startsWith('../'),
      plugins: [require('rollup-plugin-buble')()]
    }
  }
  const toTransform = fn =>
    file => file.endsWith(ext) ? fn(file) : new PassThrough()
  return browserify({
    entries: [file],
    standalone: 'Penguin',
    basedir: process.cwd()
  })
  .transform(toTransform(file =>
    new Transform({
      transform (chunk, enc, callback) { callback() },
      flush (callback) {
        compileTemplate({ file })
          .on('error', callback)
          .on('data', d => this.push(d))
          .on('end', () => callback())
      }
    })
  ))
  .transform(toTransform(() => renderClientRuntime()))
  .transform(file => rollupify(file + '.js', rollupOpts))
  .transform(envify)
  .bundle()
  .on('error', err => {
    if (err.snippet) console.error(err.snippet)
    console.error(err.message)
  })
  .pipe(createUglify())
}

function createUglify () {
  let buffer = ''
  return new Transform({
    transform (chunk, enc, callback) {
      buffer += chunk
      callback()
    },

    flush (callback) {
      const res = UglifyJS.minify(buffer.toString(), { fromString: true })
      this.push(res.code)
      callback()
    }
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}
