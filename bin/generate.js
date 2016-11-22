#!/usr/bin/env node

'use strict'

const fs = require('fs')
const minimist = require('minimist')
const toPascal = require('to-pascal-case')
const toSnake = require('to-snake-case')
const { mkdir } = require('shelljs')

const args = minimist(process.argv.slice(2))
if (args._[0] === 'react-component') {
  args._.shift()
  generateReactComponent(args)
} else {
  throw new Error('unknown generator ' + args._[0])
}

function generateReactComponent (args) {
  const rawName = args.name || args.n
  if (!rawName) throw new Error('no name given: e.g. --name MyComponent')
  const name = toPascal(rawName)
  const basename = toSnake(name)
  mkdir('-p', `components/${basename}`)
  const packageJSON = JSON.stringify({ browser: './browser' }, null, 2)
  const indexJS =
`import React from 'react'
import ReactDOMServer from 'react-dom/server'

import ${name} from './${basename}.jsx'

export default function render (props, el) {
  return ReactDOMServer.renderToString(React.createElement(${name}, props))
}`
  const browserJS =
`import React from 'react'
import ReactDOM from 'react-dom'

import ${name} from './${basename}.jsx'

export default function render (props, el) {
  return ReactDOM.render(React.createElement(${name}, props), el)
}`
  const componentJSX =
`import React from 'react'

export default function ${name} () {
  return (
    <div />
  )
}`
  fs.writeFileSync(`components/${basename}/package.json`, packageJSON)
  fs.writeFileSync(`components/${basename}/index.js`, indexJS)
  fs.writeFileSync(`components/${basename}/browser.js`, browserJS)
  fs.writeFileSync(`components/${basename}/${basename}.jsx`, componentJSX)
  console.log(`Generated ${name} in components/${basename}`)
}
