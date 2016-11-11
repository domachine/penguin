#!/usr/bin/env node

'use strict'

const fs = require('fs')
const browserify = require('browserify')
const str = require('string-to-stream')
const babel = require('babel-core')

const js = `\
import components from './components'
const component = components[__component]
__output.string = component(__props)
`

const output = 'pack/renderer.js'
browserify(str(js), { basedir: process.cwd(), detectGlobals: false, browserField: false })
  .transform('babelify', {
    presets: ['react'],
    plugins: ['transform-es2015-modules-commonjs']
  })
  .transform('envify', { _: 'purge' })
  .bundle()
  .pipe(fs.createWriteStream(output))
  .on('finish', () => {
    const opts = { presets: ['babili'], comments: false }
    babel.transformFile(output, opts, (err, res) => {
      if (err) throw err
      fs.writeFileSync(output, res.code)
    })
  })
