'use strict'

const fs = require('fs')
const { join } = require('path')
const { spawn, execFile } = require('child_process')
const rimraf = require('rimraf')

module.exports = args => {
  const url = args.url || args.u
  const branch = args.branch || args.b || 'master'
  const git = args.git || args.g || 'git'
  if (!url) {
    throw new Error('no url given! (e.g. --url https://github/me/myrepo.git)')
  }
  return output =>
    new Promise((resolve, reject) => {
      // Checkout repository
      fs.mkdtemp('penguin-git-clone-', (err, path) => {
        if (err) return reject(err)
        execFile(git, [
          'clone', '--no-checkout',
          '--depth', '1',
          '--branch', branch,
          url, path
        ],
          err => {
            if (err) return reject(err)
            rimraf(join(output, '.git'), err => {
              if (err) return reject(err)
              fs.rename(join(path, '.git'), join(output, '.git'), err => {
                if (err) return reject(err)
                fs.rmdir(path, err => {
                  if (err) return reject(err)
                  resolve()
                })
              })
            })
          })
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        spawn(git, ['add', '.'], { stdio: 'inherit', cwd: output })
          .on('error', reject).on('close', code => {
            if (code !== 0) return reject(new Error(code))
            commit()
          })
        function commit () {
          execFile(git, [
            '-c', 'user.name=Penguin',
            '-c', 'user.email=<>',
            'commit',
            '-m', 'Update content from penguin.js'
          ], { cwd: output }, err => {
            if (err && err.code !== 1) return reject(err)
            push()
          })
        }
        function push () {
          execFile(git, ['push', url, branch], { cwd: output }, err => {
            if (err) return reject(err)
            resolve()
          })
        }
      })
    })
}
