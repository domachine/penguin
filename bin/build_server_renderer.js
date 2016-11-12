#!/usr/bin/env node

'use strict'

const browserify = require('browserify')
const str = require('string-to-stream')
const babel = require('babel-core')

const pkg = require('../package.json')

browserify(str(js(pkg)), { basedir: process.cwd(), detectGlobals: false, browserField: false })
  .transform('babelify', {
    presets: ['react'],
    plugins: ['transform-es2015-modules-commonjs']
  })
  .transform('envify', { _: 'purge' })
  .bundle((err, content) => {
    if (err) throw err
    const opts = { presets: ['babili'], comments: false }
    const res = babel.transform(content, opts)
    if (err) throw err
    console.log(res.code)
  })

function js ({ name }) {
  return (
`import { createStore } from 'redux'

import components from './components'
import reduce from '${name}/reducers'
import dataToState from '${name}/lib/data_to_state'

const { component, props, data } = __params
const store = createStore(reduce, dataToState(data))
__params.output = components[component](Object.assign({}, props, { store }))
`
  )
}
