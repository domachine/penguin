#!/usr/bin/env node

const { spawn } = require('child_process')

spawn('babel', [
  '-d', '.',
  '--ignore', '*_test.js',
  '--watch',
  'src'
], { stdio: 'inherit' })
