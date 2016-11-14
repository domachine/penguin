#!/usr/bin/env node

'use strict'

const minimist = require('minimist')
const { build } = require('penguin.js-core')

process.on('unhandledRejection', err => { throw err })

const args = minimist(process.argv.slice(2))
const templatePrefix = args['template-prefix'] || args.p || 'pack'
const databasePrefix = args['data-prefix'] || args.d || 'data'
const output = args.output || args.o || 'dist'

build({ templatePrefix, databasePrefix, output })
