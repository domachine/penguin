#!/usr/bin/env node

'use strict'

const browserify = require('browserify')
const str = require('string-to-stream')
const babel = require('babel-core')
const babelify = require('babelify')
const envify = require('envify')

const pkg = require('../package.json')

browserify(str(js(pkg)), { basedir: process.cwd(), detectGlobals: false, browserField: false })
  .transform(babelify.configure({
    presets: [require('babel-preset-react')],
    plugins: [require('babel-plugin-transform-es2015-modules-commonjs')]
  }))
  .transform(envify)
  .bundle((err, content) => {
    if (err) throw err
    const opts = { presets: [require('babel-preset-babili')], comments: false }
    const res = babel.transform(content, opts)
    if (err) throw err
    console.log(res.code)
  })

function js ({ name }) {
  return (
`import render from '${name}/server.js'
import dataToState from '${name}/lib/data_to_state'
import components from './components'
const { component: name, props, data } = __params
const component = components[name]
__params.output =
  !component ? '' : render(component, { props, state: dataToState(data) })
`
  )
}
