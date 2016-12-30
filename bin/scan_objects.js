#!/usr/bin/env node

'use strict'

const { Transform } = require('stream')
const resolve = require('resolve')

module.exports = createObjectStream

if (require.main === module) {
  main(require('subarg')(process.argv.slice(2)))
}

function main (args) {
  const languageArgs = (args.languages || args.l)
  if (!languageArgs) {
    return error('no languages given (e.g. --languages [ de en ])')
  }
  const languages =
    typeof languageArgs === 'string'
      ? [languageArgs]
      : (Array.isArray(languageArgs._) ? languageArgs._ : [])
  const databaseDriverArgs = args['database-driver'] || args.d
  const basedir = args.basedir || args.b || process.cwd()
  if (typeof databaseDriverArgs !== 'object') {
    return error('no database driver given (e.g. -d [ mydriver ])')
  }
  const databaseDriverModule = databaseDriverArgs._.shift()
  resolve(databaseDriverModule, { basedir }, (err, p) => {
    if (err) throw err
    const createDriver = require(p)
    const databaseDriver = createDriver(databaseDriverArgs)
    createObjectStream({ databaseDriver, languages })
      .on('end', () => {
        if (databaseDriver.close) databaseDriver.close()
      })
      .pipe(new Transform({
        objectMode: true,
        transform (chunk, enc, callback) {
          callback(null, JSON.stringify(chunk) + '\n')
        }
      }))
      .pipe(process.stdout, { end: false })
  })
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}

function createObjectStream ({ databaseDriver, languages }) {
  let sent = {}
  return databaseDriver.getObjects({})
    .pipe(new Transform({
      objectMode: true,
      transform (chunk, enc, callback) {
        const { object: { type, id }, language } = chunk
        if (!sent[type]) sent[type] = {}
        if (!sent[type][id]) sent[type][id] = new Set([language])
        else sent[type].add(language)
        callback(null, Object.assign({}, chunk, {
          template: `objects/${type}`
        }))
      },
      flush (callback) {
        for (let type of Object.keys(sent)) {
          for (let id of Object.keys(sent[type])) {
            for (let language of languages) {
              if (!sent[type][id].has(language)) {
                this.push({
                  key: `/${language}/${type}/${id}`,
                  value: {},
                  template: `objects/${type}`
                })
              }
            }
          }
        }
        callback()
      }
    }))
}
