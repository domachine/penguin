#!/usr/bin/env node

'use strict'

const minimist = require('minimist')
const resolve = require('resolve')
const json = require('json-query')

const args = minimist(process.argv.slice(2))
const basedir = args.basedir || args.b || process.cwd()
const query = args.query || args.q
const path = args._[0] || './package.json'

if (!query) error('no query given e.g: --query my.field')

resolve(path, { basedir }, (err, p, pkg = {}) => {
  if (err) throw err
  const { value: map = {} } = json(query, { data: pkg })
  console.log(createImportMap({ map }))
})

function createImportMap ({ map }) {
  const entryInfos =
    Object
      .keys(map)
      .map(name => ({ name, path: map[name] }))
  return `${entryInfos
    .map((info, i) => `import C${i} from '${info.path}'`)
    .join('\n')}
export default {
  ${entryInfos
    .map((info, i) => `'${info.name}': ${`C${i}`},`)
    .join('\n  ')}
}`
}

function error (msg) {
  console.error('error: ' + msg)
  process.exit(1)
}
