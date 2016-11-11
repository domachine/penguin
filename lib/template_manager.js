'use strict'

const { join } = require('path')
const fs = require('fs')

module.exports = createTemplateManager

function createTemplateManager ({ prefix = '.' } = {}) {
  return {
    getTemplate (type, name) {
      const path = join(prefix, type + 's', name + '.html')
      return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, content) => {
          if (err) return resolve(null)
          resolve(readMeta(type, name).then(meta => ({ meta, content })))
        })
      })
    }
  }

  function readMeta (type, name) {
    const path = join(prefix, type + 's', name + '.meta.json')
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf-8', (err, content) => {
        if (err) return resolve({})
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
}
