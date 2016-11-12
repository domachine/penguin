#!/usr/bin/env node

'use strict'

const { spawn } = require('child_process')

spawn('babel', [
  '-d', '.',
  '--ignore', '*_test.js',
  'src'
], { stdio: 'inherit' })
