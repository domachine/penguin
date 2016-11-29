'use strict'

const { existsSync } = require('fs')
const { join } = require('path')
const express = require('express')
const readJSON = require('load-json-file')

module.exports = createDevelopmentDriver

function createDevelopmentDriver ({
  engine,
  languages,
  ext,
  prefix,
  filesPrefix,
  staticPrefix
}) {
  return {
    index (res, next) {
      res.sendFile('index.html', { root: filesPrefix }, (err) => {
        if (err && err.status === 404) res.redirect('/' + languages[0] + '/')
        else next(err)
      })
    },

    page ({ params }, res, next) {
      if (!languages.includes(params.language)) return serve404(res, next)
      const page = params.page || 'index'
      const p = join(prefix, `pages/${page}.${ext}`)
      if (!existsSync(p)) return serve404(res, next)
      render(res, p, next)
    },

    object ({ databaseDriver, params }, res, next) {
      const { language, type } = params
      if (!languages.includes(language)) return serve404(res, next)
      const p = join(prefix, `objects/${type}.${ext}`)
      if (!existsSync(p)) return serve404(res, next)
      render(res, p, next)
    },

    meta ({ params: { path } }) {
      return readJSON(path + '.json').catch(() => ({}))
    },
    static: express.static(join(process.cwd(), staticPrefix))
  }

  function serve404 (res, next) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/html')
    res.sendFile('404.html', { root: filesPrefix }, (err) => {
      if (err && err.status === 404) res.end(page404())
      else return next(err)
    })
  }

  function render (res, filepath, callback) {
    engine(filepath)
      .then(c => {
        res.writeHead(200, {
          'Content-Type': 'text/html'
        })
        res.end(c)
      }, callback)
  }
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
