#!/usr/bin/env node

'use strict'

const fs = require('fs')
const { join, basename } = require('path')
const glob = require('glob')
const toPascal = require('to-pascal-case')
const minimist = require('minimist')
const gaze = require('gaze')

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
  if (!watch) {
    writer()
  } else {
    if (initial) writer()
    gaze(pattern, function (err) {
      if (err) throw err
      this.on('added', writer)
      this.on('deleted', writer)
    })
  }
}

function createStreamFactory ({ output }) {
  return () =>
    output === '-'
      ? Object.assign(Object.create(process.stdout), { end () {} })
      : fs.createWriteStream(output)
}

function createWriter ({ stream, output, pattern }) {
  return () => {
    const files = glob.sync(pattern)
    const s = typeof stream === 'function' ? stream() : stream
    s.end(
`${files
    .map((file, i) => `import C${i} from './${file}'`)
    .join('\n')}
export default {
${files
    .map((file, i) =>
      `  '${toPascal(basename(file).split('.')[0])}': ${`C${i}`}`
    )
    .join(',\n')}
}`
    )
    console.error(output + ' written')
  }
}
