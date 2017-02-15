#!/usr/bin/env node

'use strict'

const { Transform, PassThrough } = require('stream')
const { extname } = require('path')
const browserify = require('browserify')
const browserifyMiddleware = require('browserify-middleware')
const envify = require('envify')
const UglifyJS = require('uglify-js')
const rollupify = require('rollupify')

const renderClientRuntime = require('./render_client_runtime')
const compileTemplate = require('./compile_template')

exports = module.exports = buildClientRuntime
exports.middleware = middleware

if (require.main === module) {
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const file = args._[0]
  if (!file) return error('penguin: no file given (e.g. myfile.html)')
  return buildClientRuntime({ file })
    .pipe(process.stdout)
}

function buildClientRuntime ({ file, transforms }) {
  process.env.NODE_ENV = 'production'
  const ext = extname(file)
  return browserify({
    entries: [file],
    standalone: 'Penguin',
    basedir: process.cwd(),
    transform: createTransforms({ ext, transforms })
  })
  .bundle()
  .on('error', err => {
    if (err.snippet) console.error(err.snippet)
    console.error(err.message)
  })
  .pipe(createUglify())
}

function middleware ({ ext, transforms }) {
  return browserifyMiddleware(process.cwd(), {
    grep: new RegExp(`\\${ext}$`),
    standalone: 'Penguin',
    transform: createTransforms({ ext, transforms })
  })
}

function createTransforms ({ ext, transforms = [] }) {
  const rollupOpts = {
    config: {
      external: id => !id.startsWith('./') && !id.startsWith('/') && !id.startsWith('../'),
      plugins: [...transforms, require('rollup-plugin-buble')()]
    }
  }
  const toPageTransform = fn =>
    file => (
      file.match(new RegExp(`^${process.cwd()}/(pages|objects)/.+${ext}$`))
        ? fn(file)
        : new PassThrough()
    )

  return [
    toPageTransform(file =>
      new Transform({
        transform (chunk, enc, callback) { callback() },
        flush (callback) {
          compileTemplate({ file })
            .on('error', callback)
            .on('data', d => this.push(d))
            .on('end', () => callback())
        }
      })
    ),
    toPageTransform(() => renderClientRuntime()),
    file => rollupify(file + '.js', rollupOpts),
    envify
  ]
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
