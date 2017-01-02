#!/usr/bin/env node

'use strict'

const { spawn } = require('child_process')

const commands = {
  build: 'build.js',
  pack: 'pack.js',
  serve: 'serve.js',
  run: 'run.js',
  generate: 'generate.js',
  publish: 'publish.js'
}

const command = commands[process.argv[2]]
if (!command) {
  console.error('unrecognized command!')
  process.exit(1)
}
const pkg = require(`${process.cwd()}/package.json`).penguin
if (!Array.isArray(pkg.languages)) {
  console.error('no languages in package.json specified. e.g.:')
  console.error(
`
    {
      "penguin": {
        "languages": ["en"]
      }
    }
`
  )
  process.exit(1)
}
spawn(`${__dirname}/${command}`, process.argv.slice(3), { stdio: 'inherit' })
