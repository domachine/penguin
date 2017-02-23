'use strict'

const startServer = require('./start_server')
const fsDriver = require('../fs')
const productionDriver = require('../lib/production_driver')

module.exports = run

function run ({
  prefix,
  viewDriver = productionDriver({}),
  databaseDriver = fsDriver({}),
  publishDriver,
  middleware,
  port,
  config
}) {
  return startServer({
    prefix,
    viewDriver,
    databaseDriver,
    publishDriver,
    languages: config.languages,
    middleware,
    port,
    config
  })
}
