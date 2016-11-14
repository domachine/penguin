#!/usr/bin/env node

'use strict'

const browserify = require('browserify')
const babel = require('babel-core')
const babelify = require('babelify')
const envify = require('envify')

const createClientRendererScript = require('../lib/client_renderer_script')
const pkg = require('../package.json')

browserify({
  entries: [createClientRendererScript(pkg)],
  basedir: process.cwd()
})
.transform(babelify.configure({
  presets: [
    require('babel-preset-react'),
    require('babel-preset-es2015')
  ]
}))
.transform(envify)
.bundle((err, content) => {
  if (err) throw err
  const opts = { presets: [require('babel-preset-babili')], comments: false }
  const res = babel.transform(content, opts)
  if (err) throw err
  console.log(res.code)
})
