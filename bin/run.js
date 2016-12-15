#!/usr/bin/env node

'use strict'

const subarg = require('subarg')
const resolveMod = require('resolve')

const createApp = require('../lib/app')

main(subarg(process.argv.slice(2)))

function main (args) {
  const { languages } = require(`${process.cwd()}/package.json`).penguin
  const databaseDriverArgs = args['database-driver'] || args.d || {
    _: ['penguin.js/lib/fs_driver']
  }
  const viewDriverArgs = args['view-driver'] || args.v || {
    _: ['penguin.js/lib/production_driver']
  }
  const basedir = args.basedir || args.b || process.cwd()
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. -d [ mydriver ])')
  }
  const databaseDriverModule = databaseDriverArgs._.shift()
  if (typeof viewDriverArgs !== 'object') {
    return error('no view driver given (e.g. -d [ mydriver ])')
  }
  const viewDriverModule = viewDriverArgs._.shift()
  Promise.all([
    new Promise((resolve, reject) => {
      resolveMod(databaseDriverModule, { basedir }, (err, p) => {
        if (err) return reject(err)
        const createDriver = require(p)
        resolve(createDriver(databaseDriverArgs))
      })
    }),
    new Promise((resolve, reject) => {
      resolveMod(viewDriverModule, { basedir }, (err, p) => {
        if (err) return reject(err)
        const createDriver = require(p)
        resolve(createDriver(viewDriverArgs))
      })
    })
  ])
  .then(([databaseDriver, viewDriver]) => {
    const app = createApp({ viewDriver, databaseDriver, languages })
    app.listen(process.env.PORT || 3000, () => {
      console.log('> Ready on port ' + (process.env.PORT || 3000))
    })
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}
