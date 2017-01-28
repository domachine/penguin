'use strict'

const { PassThrough, Transform } = require('stream')
const fs = require('fs')
const rollup = require('rollup')
const Bluebird = require('bluebird')
const writeFile = Bluebird.promisify(fs.writeFile)
const unlink = Bluebird.promisify(fs.unlink)
const path = require('path')

module.exports = (filename, opts) => {
  if (!/\.(?:js|es|es6|jsx|ts|tsx)$/.test(filename)) return new PassThrough()
  let source = ''
  return new Transform({
    transform (chunk, enc, callback) {
      source += chunk.toString('utf8')
      callback()
    },
    flush (chunk, enc, callback) {
      const tmpfile =
        path.resolve(path.dirname(filename), path.basename(filename) + '.tmp')
      const doSourceMap = opts.sourceMaps !== false
      writeFile(tmpfile, source, 'utf8')
        .then(() => {
          let config = {}
          if (typeof opts.config === 'string') {
            let configPath = /^\//.test(opts.config) ? opts.config : process.cwd() + '/' + opts.config
            config = require(configPath)
          } else if (typeof opts.config === 'object') config = opts.config
          return rollup.rollup(Object.assign(config, {
            entry: tmpfile,
            sourceMap: doSourceMap ? 'inline' : false
          }))
        }).then(bundle => {
          const generated = bundle.generate({format: 'cjs'})
          this.push(generated.code)
          this.push(null)
          bundle.modules.forEach(module => {
            if (!/\.tmp$/.test(module.id)) this.emit('file', module.id)
          })
        }, err => this.emit('error', err))
        .then(() => unlink(tmpfile).catch(() => {}))
        .then(callback)
    }
  })
}
