'use strict'

const { parse } = require('url')
const { Transform, PassThrough } = require('stream')
const { Pool } = require('pg')
const QueryStream = require('pg-query-stream')

module.exports = ({ url, ssl = false }) => {
  const params = parse(url)
  const auth = (params.auth || '').split(':')
  const pool = new Pool({
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl
  })
  setupDatabase({ pool })
  return {
    getGlobals ({ language }) {
      language = language || 'not_localized'
      const statement = 'SELECT fields FROM globals WHERE language = $1 LIMIT 1'
      return pool.query(statement, [language])
        .then(r => {
          if (!r.rowCount) return null
          return r.rows[0].fields
        })
    },

    getPage ({ language, name }) {
      language = language || 'not_localized'
      const statement =
        'SELECT fields FROM pages WHERE name = $1 AND language = $2 LIMIT 1'
      return pool.query(statement, [name, language])
        .then(r => {
          if (!r.rowCount) return null
          return r.rows[0].fields
        })
    },

    getObject ({ language, type, id }) {
      language = language || 'not_localized'
      const statement =
        `SELECT fields FROM objects
        WHERE id = $1 AND type = $2 AND language = $3 LIMIT 1`
      return pool.query(statement, [id, type, language])
        .then(r => {
          if (!r.rowCount) return null
          return r.rows[0].fields
        })
    },

    saveGlobals (data, { language }) {
      language = language || 'not_localized'
      const statement =
        `INSERT INTO globals (language, fields)
        VALUES ($1, $2)
        ON CONFLICT (language) DO UPDATE SET fields = $2`
      return pool.query(statement, [language, JSON.stringify(data)])
    },

    savePage (data, { language, name }) {
      language = language || 'not_localized'
      const statement =
        `INSERT INTO pages (name, language, fields)
        VALUES ($1, $2, $3)
        ON CONFLICT (name, language) DO UPDATE SET fields = $3`
      return pool.query(statement, [name, language, JSON.stringify(data)])
    },

    saveObject (data, { language, type, id }) {
      language = language || 'not_localized'
      const statement =
        `INSERT INTO objects (id, type, language, fields)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id, type, language) DO UPDATE SET fields = $4`
      return pool.query(statement, [id, type, language, JSON.stringify(data)])
    },

    destroyObject ({ type, id }) {
      const statement = (
        `DELETE FROM objects WHERE type = $1 AND id = $2`
      )
      return pool.query(statement, [type, id])
    },

    getPages ({ language }) {
      const statement =
        language === undefined
          ? `SELECT * FROM pages WHERE language != 'not_localized'`
          : 'SELECT * FROM pages WHERE language = $1'
      const params = language === undefined ? [] : [language]
      const s = new PassThrough({ objectMode: true })
      pool.connect((err, client, done) => {
        if (err) s.emit('error', err)
        const q = new QueryStream(statement, params)
        client.query(q)
          .on('end', () => done())
          .pipe(new Transform({
            objectMode: true,
            transform (chunk, enc, callback) {
              callback(null, {
                language: chunk.language,
                page: { name: chunk.name },
                key: `/${chunk.language}/${chunk.name}`,
                value: chunk.fields
              })
            }
          }))
          .pipe(s)
      })
      return s
    },

    getObjects ({ language }) {
      const statement =
        language === undefined
          ? `SELECT * FROM objects WHERE language != 'not_localized'`
          : 'SELECT * FROM objects WHERE language = $1'
      const params = language === undefined ? [] : [language]
      const s = new PassThrough({ objectMode: true })
      pool.connect((err, client, done) => {
        if (err) s.emit('error', err)
        const q = new QueryStream(statement, params)
        client.query(q)
          .on('end', () => done())
          .pipe(new Transform({
            objectMode: true,
            transform (chunk, enc, callback) {
              callback(null, {
                language: chunk.language,
                object: { type: chunk.type, id: chunk.id },
                key: `/${chunk.language}/${chunk.type}/${chunk.id}`,
                value: chunk.fields
              })
            }
          }))
          .pipe(s)
      })
      return s
    },

    close () {
      return pool.end()
    }
  }
}

function setupDatabase ({ pool }) {
  pool.query(
    `CREATE TABLE IF NOT EXISTS globals (
      language varchar(15) UNIQUE,
      fields json NOT NULL
    )`
  )
  .then(() =>
    pool.query(
      `CREATE TABLE IF NOT EXISTS pages (
        name text NOT NULL,
        language varchar(15),
        fields json NOT NULL,
        UNIQUE (name, language)
      )`
    )
  )
  .then(() =>
    pool.query(
      `CREATE TABLE IF NOT EXISTS objects (
        id text NOT NULL,
        type text NOT NULL,
        language varchar(15),
        fields json NOT NULL,
        UNIQUE (id, type, language)
      )`
    )
  )
}
