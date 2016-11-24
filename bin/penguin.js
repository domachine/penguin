#!/usr/bin/env node

'use strict'

const { spawn } = require('child_process')

const commands = {
  build: 'build.js',
  pack: 'pack.js',
  serve: 'serve.js',
  generate: 'generate.js'
}

const command = commands[process.argv[2]]
if (!command) {
  console.error('unrecognized command!')
  process.exit(1)
}
if (!process.env.npm_package_penguin_languages_0) {
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
