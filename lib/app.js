'use strict'

const { existsSync, readFileSync } = require('fs')
const { join } = require('path')
const express = require('express')
const bodyParser = require('body-parser').json
const writeJSON = require('write-json-file')
const readJSON = require('load-json-file')

module.exports = createApp

function createApp ({
  engine,
  ext,
  staticPrefix,
  defaultLanguage,
  dataPrefix = 'data',
  filesPrefix = 'files'
}) {
  const app = express()
  registerEngine(app, ext, engine)
  app.set('views', process.cwd())
  app.use('/static', express.static(join(process.cwd(), staticPrefix)))
  app.put('/data/website.json',
    bodyParser(),
    createDataWriter({ dataPrefix, file: 'website.json' })
  )
  app.put('/data/:type/:id.json',
    bodyParser(),
    createDataWriter({ dataPrefix })
  )
  app.use('/data', express.static(join(process.cwd(), dataPrefix)))
  app.use('/templates/:folder/:id.json', (req, res, next) => {
    const path = req.params.folder + '/' + req.params.id
    const metaPath = path + '.meta.json'
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    const signature = [req.params.folder.slice(0, -1), req.params.id]
    res.render(path, { signature }, (err, content) => {
      if (err) return next(err)
      res.send({ meta, content })
    })
  })
  app.get('/', (req, res, next) => {
    res.redirect('/' + defaultLanguage + '/')
  })
  app.get('/:lang/:page?', (req, res, next) => {
    if (req.params.page === 'favicon.ico') return next()
    const page = req.params.page || 'index'
    const p = join(app.get('views'), `pages/${page}.${ext}`)
    if (!existsSync(p)) {
      req.url = '/404.html'
      return next()
    }
    res.render(`pages/${page}`, { signature: ['page', page] })
  })
  app.get('/:lang/:type/:id', (req, res, next) => {
    const p = join(app.get('views'), `objects/${req.params.type}.${ext}`)
    if (!existsSync(p)) {
      req.url = '/404.html'
      return next()
    }
    res.render(`objects/${req.params.type}`, {
      signature: ['object', req.params.type]
    })
  })
  app.use(express.static(join(process.cwd(), filesPrefix)))
  app.use((req, res) => {
    res.send(page404())
  })
  return app
}

function createDataWriter ({ dataPrefix, file }) {
  return function updateFile (req, res, next) {
    const path =
      file
        ? join(dataPrefix, file)
        : join(dataPrefix, req.params.type, req.params.id + '.json')
    readJSON(path)
      .catch(() => ({}))
      .then(o => {
        const data = Object.assign({}, o, { fields: req.body.fields })
        return writeJSON(path, data).then(() => res.send(data), next)
      })
  }
}

function registerEngine (app, ext, engine) {
  app.engine(ext, (filepath, options, callback) => {
    engine(filepath, options)
      .then(c => callback(null, c), callback)
  })
  app.set('view engine', ext)
}

function page404 () {
  return (
`
<html>
  <head>
    <title>File not found!</title>
    <style>
      .error {
        color: #000;
        background: #fff;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        position: absolute;
        font-family: -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", "Fira Sans", Avenir, "Helvetica Neue", "Lucida Grande", sans-serif;
        text-align: center;
        padding-top: 20%;
      }

      .desc {
        display: inline-block;
        text-align: left;
        line-height: 49px;
        height: 49px;
        vertical-align: middle;
      }

      .h1 {
        display: inline-block;
        border-right: 1px solid rgba(0, 0, 0,.3);
        margin: 0;
        margin-right: 20px;
        padding: 10px 23px;
        font-size: 24px;
        font-weight: 500;
        vertical-align: top;
      }

      .h2 {
        font-size: 14px;
        font-weight: normal;
        margin: 0;
        padding: 0;
      }

      .footer {
        position: absolute;
        width: 100%;
        bottom: 0;
        height: 50px;
        font-family: monospace;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class='error'>
      <div class='text'>
        <h1 class='h1'>404</h1>
        <div class='desc'>
          <h2 class='h2'>
            File not found.<br />
          </h2>
        </div>
        <p>
          <code>
            /* Replace this with your own error-page by creating files/404.html */
          </code>
        </p>
      </div>
    </div>
    <div class='footer'>
      &lt;penguin.js&gt; | <a href='https://github.com/domachine/penguin.js'>Github</a>
    </div>
  </body>
</html>
`
  )
}
