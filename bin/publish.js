'use strict'

module.exports = publish

function publish ({ buildDir, publishDriver }) {
  return publishDriver(buildDir)
}
