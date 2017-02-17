module.exports = {
  format: 'es',
  plugins: [
    require('rollup-plugin-node-resolve')({ preferBuiltins: false }),
    require('rollup-plugin-commonjs')(),
    require('rollup-plugin-babel')({
      exclude: 'node_modules/**',
      presets: [
        ['es2015', { modules: false }]
      ],
      plugins: [
        'external-helpers'
      ]
    })
  ]
}
