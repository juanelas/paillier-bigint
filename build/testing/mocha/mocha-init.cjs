'use strict'

const fs = require('fs')
const path = require('path')
const chai = require('chai')
const rimraf = require('rimraf')
require('dotenv').config()

const rollupBuilder = require('./builders/RollupBuilder.cjs').rollupBuilder
const testsBuilder = require('./builders/TestsBuilder.cjs').testBuilder

const rootDir = path.join(__dirname, '../../../')
const pkgJson = require(path.join(rootDir, 'package.json'))

const mochaTsRelativeDir = pkgJson.directories['mocha-ts']
const tempDir = path.join(rootDir, mochaTsRelativeDir)

global.chai = chai
global.IS_BROWSER = false

const watch = process.argv.includes('--watch') || process.argv.includes('-w')

const setup = JSON.parse(fs.readFileSync(path.join(tempDir, 'testSetup.json'), 'utf-8'))

const testFiles = setup.testFiles
let commonjs = setup.commonjs

commonjs = watch ? true : commonjs // mocha in watch mode only supports commonjs

global._MODULE_TYPE = commonjs ? 'CJS' : 'ESM'

exports.mochaGlobalSetup = async function () {
  if (watch) {
    await rollupBuilder.start({ commonjs, watch })
    testsBuilder.start({ testFiles, commonjs })
  }
}

exports.mochaHooks = {
  beforeAll: [
    async function () {
      this.timeout('120000')

      if (watch) {
        await Promise.all([rollupBuilder.ready(), testsBuilder.ready()])

        // reset any transpiled module (just delete the cache so it is fully reloaded)
        for (const key in require.cache) {
          const relativePath = path.relative(rootDir, key)
          if (relativePath.startsWith(`.mocha-ts${path.sep}`) || relativePath.startsWith(`dist${path.sep}`)) {
            delete require.cache[key]
          }
        }
      }
    }
  ]
}

exports.mochaGlobalTeardown = async function () {
  if (watch) {
    await testsBuilder.close()
    await rollupBuilder.close()
  }
  // I use the sync version of rimraf precisely because it blocks the
  // main thread and thus the mocha watcher, which otherwise would complain
  // about files being deleted
  rimraf.sync(tempDir, { disableGlob: true })
}
