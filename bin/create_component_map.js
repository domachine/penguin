#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { join, basename } = require('path')
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
  const watch = args.watch || args.w || false
  const initial = args.initial || args.i || false

  const pattern = join(dir, '*')
  const writer = createWriter({
    stream: createStreamFactory({ output }),
    pattern,
    output
  })
  const resolver = createResolver({ pattern })
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

function createResolver ({ pattern }) {
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
    .then(srcs => [].concat(...srcs))
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
