#!/usr/bin/env node

'use strict'

const pg = require('pg')

module.exports = passwordless

const commands = {
  add_user: addUser,
  remove_user: removeUser,
  list_users: listUsers
}

if (require.main === module) {
  passwordless(require('subarg')(process.argv.slice(2)))
    .then(v => {
      if (v) console.error('%s', v)
    }, err => {
      console.error('penguin-passwordless: %s', err.message)
      process.exit(1)
    })
}

function passwordless (args) {
  const { _: [command] } = args
  const fn = commands[command]
  if (!fn) {
    return Promise.reject(new Error(`Invalid command

  Valid ones are: \`add_user\`, \`remove_user\`, \`list_users\`
`))
  }
  return fn(args)
}

function addUser (args) {
  const pgURL = args['pg-url']
  const { email } = args
  if (!pgURL) return Promise.reject(new Error('No postgres URL given! (e.g. --pg-url postgres://localhost/db)'))
  if (!email) return Promise.reject(new Error('No user email given! (e.g. --email me@provider.de'))
  const client = new pg.Client(pgURL)
  return new Promise((resolve, reject) => {
    client.connect(err => {
      if (err) return reject(err)
      const query = 'INSERT INTO users (email) VALUES ($1)'
      client.query(query, [email], (err, r) => {
        if (err) return reject(err)
        client.end(err => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  })
}

function removeUser (args) {
  const pgURL = args['pg-url']
  const { email } = args
  if (!pgURL) return Promise.reject(new Error('No postgres URL given! (e.g. --pg-url postgres://localhost/db)'))
  if (!email) return Promise.reject(new Error('No user email given! (e.g. --email me@provider.de'))
  const client = new pg.Client(pgURL)
  return new Promise((resolve, reject) => {
    client.connect(err => {
      if (err) return reject(err)
      const query = 'DELETE FROM users WHERE email = $1'
      client.query(query, [email], (err, r) => {
        if (err) return reject(err)
        client.end(err => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  })
}

function listUsers (args) {
  const pgURL = args['pg-url']
  if (!pgURL) return Promise.reject(new Error('No postgres URL given! (e.g. --pg-url postgres://localhost/db)'))
  const client = new pg.Client(pgURL)
  return new Promise((resolve, reject) => {
    client.connect(err => {
      if (err) return reject(err)
      const query = 'SELECT email FROM users'
      client.query(query, (err, r) => {
        if (err) return reject(err)
        client.end(err => {
          if (err) return reject(err)
          resolve(r.rows.map(r => r.email).join('\n'))
        })
      })
    })
  })
}
