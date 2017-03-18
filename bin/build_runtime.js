#!/usr/bin/env node

'use strict'

const { extname, relative } = require('path')
const { rollup } = require('rollup')
const rollupMiddleware = require('rollup-middleware')
const cheerio = require('cheerio')
const minimatch = require('minimatch')

const compileTemplate = require('../lib/penguin_template')

exports = module.exports = buildRuntime
exports.middleware = middleware

if (require.main === module) {
  main(require('subarg')(process.argv.slice(2)))
}

const drivers = {
  pug: require('../pug'),
  html: require('../html')
}

function main (args) {
  const file = args._[0]
  const mode = args.mode || args.m
  if (!file) return error('penguin: no file given (e.g. myfile.html)')
  return buildRuntime({ file, mode })
    .pipe(process.stdout)
}

function buildRuntime ({ file, mode, transforms, penguinEnv }) {
  const ext = extname(file)
  const plugins = createPlugins({
    ext,
    transforms,
    mode,
    penguinEnv,
    env: 'production'
  })
  return rollup({ entry: file, plugins })
    .then(bundle =>
      bundle.generate({ format: 'umd', moduleName: 'Penguin' }).code
    ).catch(err => {
      if (err.code === 'PARSE_ERROR') {
        console.error(
          '%s:%d:%d: %s',
          relative(process.cwd(), err.loc.file),
          err.loc.line,
          err.loc.column,
          err.message
        )
        console.error()
        console.error(err.frame)
        console.error()
      }
      throw err
    })
}

function middleware ({ ext, transforms }) {
  return rollupMiddleware({
    rollup: {
      plugins: createPlugins({
        ext,
        mode: 'client',
        transforms,
        env: 'development'
      })
    },
    generate: {
      format: 'umd',
      moduleName: 'Penguin'
    },
    prefix: '.',
    grep: new RegExp(`\\${ext}$`)
  })
}

function createPlugins ({
  ext,
  mode,
  transforms = [],
  env = 'production',
  penguinEnv = 'development'
}) {
  const isTemplate = id =>
    minimatch(relative(process.cwd(), id), `@(pages|objects)/*${ext}`)
  const driver = drivers[ext.slice(1)]
  return [
    ...transforms,
    require('rollup-plugin-node-resolve')({ preferBuiltins: false }),
    require('rollup-plugin-commonjs')(),
    {
      transform (source, id) {
        if (!isTemplate(id)) return
        const $ = cheerio.load(
          compileTemplate(source, { driver: driver ? driver() : null })
        )
        const componentSet = new Set()
        $('[data-component]').each(function () {
          const name = $(this).attr('data-component')
          componentSet.add(name)
        })
        const components = [...componentSet]
        return createRuntimeCode(mode, components)
      }
    },
    require('rollup-plugin-babel')({
      exclude: 'node_modules/**',
      presets: [
        require('babel-preset-react'),
        require('babel-preset-es2015').buildPreset({}, { modules: false })
      ],
      plugins: [require('babel-plugin-external-helpers')]
    }),
    require('rollup-plugin-replace')({
      'process.env.NODE_ENV': JSON.stringify(env),
      'process.env.PENGUIN_ENV': JSON.stringify(penguinEnv)
    }),
    env === 'production'
      ? (
        require('rollup-plugin-uglify')({
          compress: {
            screw_ie8: true,
            warnings: false
          },
          output: {
            comments: false
          },
          sourceMap: false
        })
      )
      : false
  ].filter(Boolean)
}

function createRuntimeCode (mode, components) {
  const symbol = mode === 'server'
    ? 'createServerRuntime'
    : 'createClientRuntime'
  const noop = mode === 'server'
    ? 'function noop (state, $) { return $ }'
    : 'function noop () {}'
  const componentModule = mode === 'server'
    ? '../.penguin/server_components'
    : '../.penguin/components'
  return (
    `${components.length > 0 ? `import { ${symbol} as createRuntime } from 'penguin.js'` : ''}
${components.length > 0 ? `import { ${components.join(', ')} } from '${componentModule}'` : ''}
export default ${components.length > 0
  ? `createRuntime({ components: { ${components.join(', ')} } })`
  : noop
}`
  )
}

function error (msg) {
  console.error(msg)
  process.exit(1)
}
