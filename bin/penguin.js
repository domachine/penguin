#!/usr/bin/env node

'use strict'

const { Transform } = require('stream')
const resolveMod = require('resolve')
const subarg = require('subarg')

const commands = {
  build: 'build.js',
  pack: 'pack.js',
  serve: 'serve.js',
  run: 'run.js',
  publish: 'publish.js'
}

const command = commands[process.argv[2]]
if (!command) {
  console.error('unrecognized command!')
  process.exit(1)
}
const pkg = require(`${process.cwd()}/package.json`).penguin
if (!Array.isArray(pkg.languages)) {
  console.error('penguin: no languages in package.json specified. e.g.:')
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
} else {
  parseArgs(subarg(process.argv.slice(3)))
    .then(opts => {
      const result = require(`${__dirname}/${command}`)(opts)
      if (!result) return
      if (typeof result.then === 'function') {
        return result.then(v => process.stdout.write(stringifyValue(v)))
      } else if (typeof result.pipe === 'function') {
        result
          .pipe(new Transform({
            objectMode: true,
            transform (chunk, enc, callback) {
              callback(null, stringifyValue(chunk))
            }
          }))
          .pipe(process.stdout)
      } else {
        console.warn('penguin: Command returned invalid return type')
      }
    })
    .catch(err => {
      console.error('penguin-%s: %s', process.argv[2], err.message)
      process.exit(1)
    })
}

function parseArgs (args) {
  const config = require(`${process.cwd()}/package.json`).penguin
  const basedir = args.basedir || args.b || process.cwd()
  const buildDir = args['build-dir'] || 'build'
  const port = args.port || args.p || 3000
  const ext = args['view-engine'] || args.v
  const staticPrefix = args['static'] || args.s
  const transformArgs = args.transform || args.t
  const publishDriverArgs = args['publish-driver']
  const databaseDriverArgs = args['database-driver'] || args.d
  const viewDriverArgs = args['view-driver']
  const middlewareArgs = args['middleware'] || args.m
  const moduleArgs = [publishDriverArgs, databaseDriverArgs, viewDriverArgs]
  const middleware =
    Array.isArray(middlewareArgs)
      ? middlewareArgs
      : (middlewareArgs ? [middlewareArgs] : [])
  const transforms =
    Array.isArray(transformArgs)
      ? transformArgs
      : (transformArgs ? [transformArgs] : [])
  return Promise.all([
    ...moduleArgs.map(a => (
      a
        ? createModuleFromArgs(a, { basedir })
        : Promise.resolve()
    )),
    Promise.all(middleware.map(a => createModuleFromArgs(a, { basedir }))),
    Promise.all(transforms.map(a => createModuleFromArgs(a, { basedir })))
  ]).then(([publishDriver, databaseDriver, viewDriver, middleware, transforms]) => (
    {
      config,
      basedir,
      buildDir,
      port,
      staticPrefix,
      ext,
      publishDriver,
      databaseDriver,
      viewDriver,
      middleware,
      transforms
    }
  ))
}

function stringifyValue (v) {
  return v ? (typeof v !== 'string' ? JSON.stringify(v) : v) : ''
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
      let o
      try { o = require(p)(...args) } catch (e) { return reject(e) }
      resolve(o)
    })
  })
}
