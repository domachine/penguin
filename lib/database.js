'use strict'

const fs = require('fs')
const { basename, join } = require('path')
const glob = require('glob')

module.exports = createDatabase

function createDatabase ({ prefix }) {
  return {
    getWebsite () {
      return readJSONFile(join(prefix, 'website.json'))
        .then(website => website || defaultWebsite())
    },

    getPage (name) {
      return readJSONFile(join(prefix, 'pages', name + '.json'))
        .then(page => page || defaultPage({ name }))
    },

    getObjectIDs () {
      return new Promise((resolve, reject) => {
        glob(join(prefix, 'objects/*.json'), (err, files) => {
          if (err) return reject(err)
          resolve(files.map(f => basename(f, '.json')))
        })
      })
    },

    getObject (id) {
      return readJSONFile(join(prefix, 'objects', id + '.json'))
    }
  }
}

function defaultWebsite () {
  return { fieldKeys: [], languages: [], noLangFields: [], fields: {} }
}

function defaultPage ({ name }) {
  return { fields: {} }
}

function readJSONFile (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, content) => {
      if (err) return resolve(null)
      resolve(readJSON(content))
    })
  })
}

function readJSON (content) {
  return new Promise((resolve, reject) => {
    let object
    try {
      object = JSON.parse(content + '')
    } catch (e) { return reject(e) }
    resolve(object)
  })
}
