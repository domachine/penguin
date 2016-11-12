#!/usr/bin/env node

'use strict'

const fs = require('fs')
const browserify = require('browserify')
const str = require('string-to-stream')
const babel = require('babel-core')

const pkg = require('../package.json')

const output = 'pack/renderer.js'

browserify(str(js(pkg)), { basedir: process.cwd(), detectGlobals: false, browserField: false })
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
