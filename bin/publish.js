#!/usr/bin/env node

'use strict'

const resolveMod = require('resolve')

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const basedir = args.basedir || args.b || process.cwd()
  const buildDir = args['build-dir'] || args.d || 'build'
  const publishDriverArgs = args['publish-driver']
  if (typeof publishDriverArgs !== 'object') {
    return error('no publish driver given (e.g. --publish-driver [ mydriver ])')
  }
  createModuleFromArgs(publishDriverArgs, { basedir })
    .then(publishDriver => publish({ buildDir, publishDriver }))
}

function publish ({ buildDir, publishDriver }) {
  return publishDriver(buildDir)
}

function createModuleFromArgs (a, opts) {
  const name = a._[0]
  const args = Object.assign({}, a, { _: a._.slice(1) })
  return createModule(name, opts, args)
}

function createModule (mod, opts, ...args) {
  return new Promise((resolve, reject) => {
    resolveMod(mod, opts, (err, p) => {
      if (err) return reject(err)
      const constructor = require(p)
      resolve(constructor(...args))
    })
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}
