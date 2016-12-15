'use strict'

const { join, relative } = require('path')
const { Readable } = require('stream')
const glob = require('glob')
const loadJSON = require('load-json-file')
const writeJSON = require('write-json-file')

const {
  object: objectPathRegexp,
  page: pagePathRegexp
} = require('../lib/path_regexps')

module.exports = createDatabase

function createDatabase ({ prefix = 'data' }) {
  const load = path => loadJSON(path).catch(() => null)
  const save = (path, data) => writeJSON(path, data, { indent: 2 })
  return {
    getGlobals ({ language }) {
      language = language || 'not_localized'
      return load(join(prefix, language + '.json'))
    },

    getPage ({ language, name }) {
      language = language || 'not_localized'
      return load(join(prefix, language, name) + '.json')
    },

    getObject ({ language, type, id }) {
      language = language || 'not_localized'
      return load(join(prefix, language, type, id) + '.json')
    },

    saveGlobals (data, { language }) {
      language = language || 'not_localized'
      return save(join(prefix, language + '.json'), data)
    },

    savePage (data, { language, name }) {
      language = language || 'not_localized'
      return save(join(prefix, language, name) + '.json', data)
    },

    saveObject (data, { language, type, id }) {
      language = language || 'not_localized'
      return save(join(prefix, language, type, id) + '.json', data)
    },

    getPages ({ language = '*' }) {
      const s = language === null ? 'not_localized' : language
      const pattern = join(prefix, s, '*.json')
      return createReadStream(pattern, {
        transform (o) {
          const match = o.key.match(pagePathRegexp)
          return Object.assign({}, o, {
            language: match[1],
            page: { name: match[2] }
          })
        }
      })
    },

    getObjects ({ language = '*', type = '*' }) {
      const s = language === null ? 'not_localized' : language
      const pattern = join(prefix, s, type, '*.json')
      return createReadStream(pattern, {
        transform (o) {
          const match = o.key.match(objectPathRegexp)
          return Object.assign({}, o, {
            language: match[1],
            object: { type: match[2], id: match[3] }
          })
        }
      })
    }
  }

  function createReadStream (pattern, { transform = f => f }) {
    let i = 0
    let eof = false
    const files = glob.sync(pattern).filter(file => {
      return !(relative(prefix, file).startsWith('not_localized/'))
    })
    return new Readable({
      objectMode: true,
      read (n) {
        const ps = []
        for (let j = 0; j < n && i < files.length; ++i, ++j) {
          const file = files[i]
          const p =
            loadJSON(file)
              .then(o => {
                this.push(transform({
                  key: '/' + relative(prefix, file).replace(/\.json$/, ''),
                  value: o
                }))
              })
              .catch(err => this.emit('error', err))
          ps.push(p)
        }
        if (eof) return
        eof = i === files.length
        Promise.all(ps).then(() => { if (eof) this.push(null) })
      }
    })
  }
}
