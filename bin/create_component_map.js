#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { join, basename, relative } = require('path')
const glob = require('glob')
const toPascal = require('to-pascal-case')
const minimist = require('minimist')
const gaze = require('gaze')
const resolveModule = require('resolve')

process.on('unhandledRejection', err => { throw err })
main()

function main () {
  const args = minimist(process.argv.slice(2))
  const dir = args._[0] || 'components'
  const output = args.output || args.o || '-'
  const browser = args.browser || args.b || false
  const watch = args.watch || args.w || false
  const initial = args.initial || args.i || false

  const pattern = join(dir, '*')
  const writer = createWriter({
    stream: createStreamFactory({ output }),
    pattern,
    output
  })
  const resolver = createResolver({ pattern, browser })
  const generator = createGenerator({ resolver, writer })

  if (!watch) {
    generator()
  } else {
    if (initial) writer()
    gaze(pattern, function (err) {
      if (err) throw err
      this.on('added', generator)
      this.on('deleted', generator)
    })
    gaze('package.json', function (err) {
      if (err) throw err
      this.on('changed', generator)
    })
  }
}

function createGenerator ({ resolver, writer }) {
  return function generate () {
    return resolver().then(writer)
  }
}

function createResolver ({ pattern, browser }) {
  return function () {
    return Promise.all([
      new Promise((resolve, reject) => {
        resolveModule('./package.json', { basedir: process.cwd() }, (err, res, pkg) => {
          if (err) return reject(err)
          const { penguin: { components = {} } = {} } = pkg
          resolve(Object.keys(components).reduce((entries, name) =>
            entries.concat({ file: components[name], name })
          , []))
        })
      }),
      new Promise((resolve, reject) => {
        const files = glob.sync(pattern)
        resolve(files.map((file, i) => ({
          file: './' + file,
          name: toPascal(basename(file).split('.')[0])
        })))
      })
    ])
    .then(srcs => {
      const entries = [].concat(...srcs)
      return resolveModulePaths(entries, { browser })
    })
  }

  function resolveModulePaths (entries, { browser }) {
    return Promise.all(entries.map(entry =>
      new Promise((resolve, reject) => {
        resolveModule(entry.file, { basedir: process.cwd() }, (err, res, pkg) => {
          if (err) return reject(err)
          if (!pkg || typeof pkg.browser !== 'string') return resolve(entry)
          const prefix = entry.file.startsWith('./') ? './' : ''
          const modulePath =
            browser
              ? ((!pkg || typeof pkg.browser !== 'string')
                ? entry.file
                : prefix + join(entry.file, pkg.browser))
              : prefix + relative(process.cwd(), res)
          resolve({
            name: entry.name,
            file: modulePath
          })
        })
      })
    ))
  }
}

function createStreamFactory ({ output }) {
  return () =>
    output === '-'
      ? Object.assign(Object.create(process.stdout), {
        end (data) { if (data) this.write(data) }
      })
      : fs.createWriteStream(output)
}

function createWriter ({ stream, output, pattern }) {
  return entries => {
    // const files = glob.sync(pattern)
    const s = typeof stream === 'function' ? stream() : stream
    s.end(
`${entries.map(({ file }, i) => `import C${i} from '${file}'`).join('\n')}
export default {
${entries.map(({ name }, i) => `  '${name}': ${`C${i}`}`).join(',\n')}
}`
    )
    console.error(output + ' written')
  }
}
