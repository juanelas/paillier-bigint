'use strict'

const resolve = require('@rollup/plugin-node-resolve')
const replace = require('@rollup/plugin-replace')
const { terser } = require('rollup-plugin-terser')

const path = require('path')
const pkgJson = require('../package.json')

const rootDir = path.join(__dirname, '..')
const srcDir = path.join(rootDir, pkgJson.directories.src)
const dstDir = path.join(rootDir, pkgJson.directories.lib)

function camelise (str) {
  console.log('camelise', str)
  return str.replace(/-([a-z])/g,
    function (m, w) {
      return w.toUpperCase()
    })
}

const pkgName = pkgJson.name
const pkgCamelisedName = camelise(pkgName)

const input = path.join(srcDir, 'js', 'index.js')

module.exports = [
  { // ESM native module
    input: input,
    output: [
      {
        file: path.join(dstDir, 'index.browser.mod.js'),
        format: 'esm'
      }
    ],
    plugins: [
      replace({
        'process.browser': true
      })
    ],
    external: ['bigint-crypto-utils']
  },
  { // Browser bundles
    input: input,
    output: [
      {
        file: path.join(dstDir, 'index.browser.bundle.js'),
        format: 'iife',
        name: pkgCamelisedName
      },
      {
        file: path.join(dstDir, 'index.browser.bundle.mod.js'),
        format: 'es'
      }
    ],
    plugins: [
      replace({
        'process.browser': true
      }),
      resolve({
        browser: true
      }),
      terser({
        mangle: false,
        compress: false
      })
    ]
  },
  { // Node
    input: input,
    plugins: [
      replace({
        'process.browser': false
      })
    ],
    output: {
      file: path.join(dstDir, 'index.node.js'),
      format: 'cjs'
    },
    external: ['bigint-crypto-utils']
  }
]
