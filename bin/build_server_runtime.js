#!/usr/bin/env node

'use strict'

const browserify = require('browserify')
const str = require('string-to-stream')
const babel = require('babel-core')
const babelify = require('babelify')
const envify = require('envify')

const pkg = require('../package.json')

browserify(str(js(pkg)), { basedir: process.cwd() })
  .transform(babelify.configure({
    presets: [require('babel-preset-react')],
    plugins: [require('babel-plugin-transform-es2015-modules-commonjs')]
  }))
  .transform(envify)
  .transform(require('brfs'))
  .bundle((err, content) => {
    if (err) throw err
    const opts = { presets: [require('babel-preset-babili')], comments: false }
    const res = babel.transform(content, opts)
    if (err) throw err
    console.log(res.code)
  })

function js ({ name }) {
  return (
`import createServerRenderer from '${name}/lib/server_runtime'
import createStateSerializer from '${name}/lib/state_serializer'
import components from './server_components'
import { penguin as config } from './package.json'
const { html, data } = __params
const stateSerializer = createStateSerializer({ config })
const renderer = createServerRenderer({
  components,
  state: Object.assign({}, stateSerializer(data), { isBuilt: true })
})
const $ = renderer(html)
$('body').attr('data-penguin-built', 'true')
__params.output = $.html()
`
  )
}
