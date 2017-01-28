#!/usr/bin/env node

'use strict'

const { basename, join } = require('path')
const { Transform } = require('stream')
const resolve = require('resolve')
const glob = require('glob')

module.exports = createPageStream

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
    createPageStream({ databaseDriver, languages })
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

function createPageStream ({ databaseDriver, languages }) {
  let templates = glob.sync(join('pages', '*.html'))
  let sent = {}
  return databaseDriver.getPages({})
    .pipe(new Transform({
      objectMode: true,
      transform (chunk, enc, callback) {
        const { language, page: { name } } = chunk
        const hasTemplate =
          templates.indexOf(join('pages', name + '.html')) > -1
        if (!hasTemplate) return callback()
        if (!sent[chunk.page.name]) sent[chunk.page.name] = new Set([chunk.language])
        else sent[name].add(language)
        const res = Object.assign({}, chunk, { template: `pages/${name}` })
        callback(null, res)
      },
      flush (callback) {
        templates.forEach(template => {
          const name = basename(template, '.html')
          const sentLanguages = sent[name] || new Set()
          languages.forEach(language => {
            if (sentLanguages.has(language)) return
            const key = `/${language}/${name}`
            const template = `pages/${name}`
            this.push({ key, value: {}, template, page: { name }, language })
          })
        })
        callback()
      }
    }))
}
