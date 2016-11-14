#!/usr/bin/env node

'use strict'

const browserify = require('browserify')
const babel = require('babel-core')

const createClientRendererScript = require('../lib/client_renderer_script')
const pkg = require('../package.json')

browserify({
  entries: [createClientRendererScript(pkg)],
  basedir: process.cwd()
})
.transform('babelify', { presets: ['react', 'es2015'] })
.transform('envify', { _: 'purge' })
.bundle((err, content) => {
  if (err) throw err
  const opts = { presets: ['babili'], comments: false }
  const res = babel.transform(content, opts)
  if (err) throw err
  console.log(res.code)
})
