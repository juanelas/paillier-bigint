'use strict'

import { nodeResolve as resolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'
import typescriptPlugin from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'

import { dirname, join } from 'path'
import { existsSync, moveSync, removeSync } from 'fs-extra'
import { directories, name as _name, dependencies, peerDependencies, exports, types } from '../package.json'

const rootDir = join(__dirname, '..')
const dstDir = join(rootDir, directories.dist)
const srcDir = join(rootDir, 'src', 'ts')

function camelise (str) {
  return str.replace(/-([a-z])/g,
    function (m, w) {
      return w.toUpperCase()
    })
}

const regex = /^(?:(?<scope>@.*?)\/)?(?<name>.*)/ // We are going to take only the package name part if there is a scope, e.g. @my-org/package-name
const { name } = _name.match(regex).groups
const pkgCamelisedName = camelise(name)

const input = join(srcDir, 'index.ts')
if (existsSync(input) !== true) throw new Error('The entry point should be index.ts')

const tsBundleOptions = {
  tsconfig: join(rootDir, 'tsconfig.json'),
  outDir: undefined, // ignore outDir in tsconfig.json
  exclude: ['test/**/*', 'src/**/*.spec.ts', './build/typings/global-this-pkg.d.ts']
}

const external = [...Object.keys(dependencies || {}), ...Object.keys(peerDependencies || {})]

const sourcemapOutputOptions = {
  sourcemap: 'inline',
  sourcemapExcludeSources: true
}

function moveDirPlugin (srcDir, dstDir) {
  return {
    name: 'move-dir',
    closeBundle () {
      removeSync(dstDir)
      moveSync(srcDir, dstDir, { overwrite: true })
    }
  }
}

export default [
  { // ESM for browsers
    input: input,
    output: [
      {
        file: join(rootDir, exports['.'].default),
        ...sourcemapOutputOptions,
        format: 'es'
      }
    ],
    plugins: [
      replace({
        IS_BROWSER: true,
        preventAssignment: true
      }),
      typescriptPlugin(tsBundleOptions)
    ],
    external
  },
  { // Browser bundles
    input: input,
    output: [
      {
        file: join(dstDir, 'bundles/iife.js'),
        format: 'iife',
        name: pkgCamelisedName
      },
      {
        file: join(dstDir, 'bundles/esm.js'),
        format: 'es'
      },
      {
        file: join(dstDir, 'bundles/umd.js'),
        format: 'umd',
        name: pkgCamelisedName
      }
    ],
    plugins: [
      replace({
        IS_BROWSER: true,
        preventAssignment: true
      }),
      typescriptPlugin(tsBundleOptions),
      resolve({
        browser: true,
        exportConditions: ['browser', 'module', 'import', 'default']
      }),
      terser()
    ]
  },
  { // Node ESM with declaration files
    input: input,
    output: {
      file: join(rootDir, exports['.'].node.import),
      ...sourcemapOutputOptions,
      format: 'es'
    },
    plugins: [
      replace({
        IS_BROWSER: false,
        preventAssignment: true
      }),
      typescriptPlugin({
        ...tsBundleOptions,
        // outDir: path.join(rootDir, path.dirname(pkgJson.exports['.'].node.import)),
        declaration: true,
        declarationDir: 'types',
        declarationMap: true
      }),
      commonjs({ extensions: ['.js', '.cjs', '.ts'] }), // the ".ts" extension is required
      moveDirPlugin(join(rootDir, dirname(exports['.'].node.import), 'types'), join(rootDir, dirname(types)))
    ],
    external
  },
  { // Node CJS
    input: input,
    output: {
      file: join(rootDir, exports['.'].node.require),
      ...sourcemapOutputOptions,
      format: 'cjs'
    },
    plugins: [
      replace({
        IS_BROWSER: false,
        preventAssignment: true
      }),
      typescriptPlugin(tsBundleOptions),
      commonjs({ extensions: ['.js', '.cjs', '.ts'] }) // the ".ts" extension is required
    ]
  }
]
