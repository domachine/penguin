'use strict'

const url = require('url')
const passwordless = require('passwordless')
const RedisStore = require('passwordless-redisstore')
const parse = require('parse-redis-url')
const resolveMod = require('resolve')
const { Router } = require('express')
const session = require('express-session')
const ConnectRedis = require('connect-redis')(session)
const { Pool } = require('pg')
const { urlencoded } = require('body-parser')

module.exports = ({
  'redis-url': redisURL,
  'pg-url': postgresURL,
  'failure-redirect': failureRedirect,
  'sent-redirect': sentRedirect,
  ssl,
  delivery,
  basedir = process.cwd(),
  cookie
}) => {
  if (typeof delivery !== 'object') throw new Error('Need a delivery plugin!')
  if (!sentRedirect) sentRedirect = failureRedirect
  const u = parse(redisURL)
  const { host, port } = u
  delete u.host
  delete u.port
  passwordless.init(new RedisStore(port, host, u))
  const params = url.parse(postgresURL)
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
  const router = Router()
  createModuleFromArgs(delivery, { basedir })
    .then(d => {
      passwordless.addDelivery(d)
      const sessionOpts = Object.assign({}, cookie, {
        resave: false,
        saveUninitialized: true,
        store: new ConnectRedis({ url: redisURL })
      })
      router.use(session(sessionOpts))
      router.use(passwordless.sessionSupport())
      router.get('/auth/passwordless/login',
        passwordless.acceptToken({ successRedirect: '/' }),
        (req, res) => res.redirect('/'))
      router.get('/auth/passwordless/logout',
        passwordless.logout(),
        (req, res) => res.redirect('/'))
      router.post('/auth/passwordless',
        urlencoded({ extended: false }),
        passwordless.requestToken(
          // Turn the email address into an user ID
          (user, delivery, callback, req) => {
            pool.query('SELECT user_id FROM users WHERE email = $1', [user])
              .then(r => {
                if (!r.rowCount) return callback(null, null)
                callback(null, r.rows[0].user_id)
              }, callback)
          }, { failureRedirect }),
        (req, res) => res.redirect(sentRedirect))
      const makePublic = (req, res, next) => {
        res.locals.public = true
        next()
      }
      router.use('/static', makePublic)
      if (failureRedirect) router.get(failureRedirect, makePublic)
      if (sentRedirect !== failureRedirect) {
        router.get(sentRedirect, makePublic)
      }
      const restricted = passwordless.restricted({ failureRedirect })
      router.use((req, res, next) => {
        if (!res.locals.public) restricted(req, res, next)
        else next()
      })
    })
  return router
}

function createModuleFromArgs (a, opts) {
  const name = a._[0]
  const args = Object.assign({}, a, { _: a._.slice(1) })
  return createModule(name, opts, args)
}

function createModule (mod, opts, ...args) {
  return new Promise((resolve, reject) => {
    resolveMod(mod, opts, (err, p) => {
      if (err) return reject(err)
      const constructor = require(p)
      resolve(constructor(...args))
    })
  })
}

function setupDatabase ({ pool }) {
  pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      user_id serial PRIMARY KEY,
      email text NOT NULL UNIQUE
    )`
  )
}
