#!/usr/bin/env node

'use strict'

const { Transform } = require('stream')
const resolve = require('resolve')
const split = require('split')

module.exports = createOutputStream

if (require.main === module) {
  process.on('unhandledRejection', err => { throw err })
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const databaseDriverArgs = args['database-driver'] || args.d
  const basedir = args.basedir || args.b || process.cwd()
  const defaultLanguage = args['default-language'] || args.l
  if (!defaultLanguage) return error('penguin: no default language given (e.g. -l en)')
  if (typeof databaseDriverArgs !== 'object') {
    return error('penguin: no database driver given (e.g. -d [ mydriver ])')
  }
  const databaseDriverModule = databaseDriverArgs._.shift()
  resolve(databaseDriverModule, { basedir }, (err, p) => {
    if (err) throw err
    const createDriver = require(p)
    const databaseDriver = createDriver(databaseDriverArgs)
    process.stdin
      .pipe(split(JSON.parse, null, { trailing: false }))
      .pipe(createOutputStream({ databaseDriver, defaultLanguage }))
      .pipe(new Transform({
        objectMode: true,
        transform (chunk, enc, callback) {
          callback(null, JSON.stringify(chunk) + '\n')
        }
      }))
      .on('end', () => {
        if (databaseDriver.close) databaseDriver.close()
      })
      .pipe(process.stdout)
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}

function createOutputStream ({ databaseDriver, defaultLanguage }) {
  const globalsCache = {}
  return new Transform({
    objectMode: true,
    transform (chunk, enc, callback) {
      Promise.all([
        globalsCache[chunk.language]
          ? Promise.resolve(globalsCache[chunk.language])
          : (
            Promise.all([
              databaseDriver.getGlobals({ language: defaultLanguage }),
              databaseDriver.getGlobals({ language: chunk.language }),
              databaseDriver.getGlobals({ language: null })
            ]).then(globals => Object.assign({}, ...globals))
          ),
        chunk.object
          ? databaseDriver.getObject({
            language: defaultLanguage,
            type: chunk.object.type,
            id: chunk.object.id
          })
          : databaseDriver.getPage({
            language: defaultLanguage,
            name: chunk.page.name
          }),
        chunk.object
          ? databaseDriver.getObject({
            type: chunk.object.type,
            id: chunk.object.id
          })
          : databaseDriver.getPage({ name: chunk.page.name })
      ])
      .then(([globals, defaultLocalized, notLocalized]) => {
        globalsCache[chunk.language] = globals
        const fields =
          Object.assign(
            {},
            defaultLocalized,
            chunk.value,
            notLocalized,
            globals
          )
        this.push(Object.assign({}, chunk, { value: fields }))
      })
      .then(() => callback(), callback)
    }
  })
}
