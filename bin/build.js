#!/usr/bin/env node

'use strict'

const { Transform } = require('stream')
const { join } = require('path')
const { spawn } = require('child_process')
const { rm } = require('shelljs')
const subarg = require('subarg')
const mergeStream = require('merge-stream')
const split = require('split')

const { penguin: config } = require(join(process.cwd(), 'package.json'))

process.on('unhandledRejection', err => { throw err })

main(subarg(process.argv.slice(2)))

function main (args) {
  const runtimePath = args['server-runtime'] || args.s || 'server_runtime.js'
  const defaultDriver = { _: ['penguin.js/lib/fs_driver'], prefix: 'data' }
  const databaseDriverArgs = args['database-driver'] || args.d || defaultDriver
  const basedir = args.basedir || args.b || process.cwd()
  const prefix = args.prefix || args.p || 'docs'
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. -d [ mydriver ])')
  }
  config.languages.forEach(language => {
    const langOutput = join(prefix, language)
    rm('-rf', langOutput)
  })
  const objects = createJSONStream(`${__dirname}/scan_objects.js`,
    ['--basedir', basedir, '--database-driver', '[']
      .concat(toArguments(databaseDriverArgs))
      .concat([']', '--languages', '['])
      .concat(config.languages).concat([']']))
  const pages = createJSONStream(`${__dirname}/scan_pages.js`,
    ['--prefix', prefix, '--basedir', basedir, '--languages', '[']
      .concat(config.languages).concat([']'])
      .concat(['--database-driver', '['])
      .concat(toArguments(databaseDriverArgs))
      .concat([']']))
  const render = spawn(`${__dirname}/render_html.js`,
    [
      '--prefix', prefix,
      '--basedir', basedir,
      '--server-runtime', runtimePath,
      '--languages', '['
    ]
    .concat(config.languages).concat([']'])
    .concat(['--database-driver', '['])
    .concat(toArguments(databaseDriverArgs))
    .concat([']']),
    { stdio: ['pipe', 'inherit', 'inherit'] })
  mergeStream(objects, pages)
    .pipe(new Transform({
      transform (chunk, enc, callback) {
        callback(null, chunk.toString() + '\n')
      }
    }))
    .pipe(render.stdin)
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}

function toArguments (o) {
  return Object.keys(o).reduce((args, key) =>
    args
      .concat(
        key === '_'
          ? []
          : [key.length === 1 ? `-${key}` : `--${key}`]
      )
      .concat(
        Array.isArray(o[key])
          ? o[key]
          : [o[key]]
      )
  , [])
}

function createJSONStream (path, args) {
  const stdio = ['ignore', 'pipe', 'inherit']
  const proc = spawn(path, args, { stdio })
  return proc.stdout.pipe(split(null, null, { trailing: false }))
}
