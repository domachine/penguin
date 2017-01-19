#!/usr/bin/env node

'use strict'

const browserify = require('browserify')
const babelify = require('babelify')
const envify = require('envify')
const UglifyJS = require('uglify-js')
const uglifyify = require('uglifyify')
const str = require('string-to-stream')

const createClientRuntimeScript = require('../lib/client_runtime_script')
const pkg = require('../package.json')

browserify({
  entries: [str(createClientRuntimeScript(pkg))],
  basedir: process.cwd()
})
.transform(babelify.configure({
  presets: [
    require('babel-preset-react'),
    require('babel-preset-es2015')
  ]
}))
.transform(envify)
.transform(uglifyify)
.bundle((err, content) => {
  if (err) throw err
  const res = UglifyJS.minify(content.toString(), { fromString: true })
  console.log(res.code)
})
