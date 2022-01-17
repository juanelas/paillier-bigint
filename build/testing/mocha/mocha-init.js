'use strict'

const path = require('path')

const chai = require('chai')
const rimraf = require('rimraf')

const RollupBuilder = require('./builders/RollupBuilder.js')
const TestsBuilder = require('./builders/TestsBuilder.js')

const rootDir = path.join(__dirname, '../../../')

global.chai = chai
loadPkgToGlobal()

global.IS_BROWSER = false

const watch = process.argv.includes('--watch') || process.argv.includes('-w')

const tempDir = path.join(rootDir, '.mocha-ts')

const rollupBuilder = new RollupBuilder({ name: 'rollup', configPath: path.join(rootDir, 'build/rollup.config.js'), tempDir, watch })
const testBuilder = new TestsBuilder({ name: 'tsc', tempDir })

rollupBuilder.start() // This should be in exports.mochaGlobalSetup but mocha fails when not in watch mode (DIRT...)
testBuilder.start() // This should be in exports.mochaGlobalSetup but mocha fails when not in watch mode (DIRT...)

exports.mochaHooks = {
  beforeAll: [
    async function () {
      this.timeout('120000')

      await Promise.all([rollupBuilder.ready(), testBuilder.ready()])

      // Just in case our module had been modified. Reload it when the tests are repeated (for mocha watch mode).
      delete require.cache[require.resolve(rootDir)]
      loadPkgToGlobal()

      // And now reset any other transpiled module (just delete the cache so it is fully reloaded)
      for (const key in require.cache) {
        const relativePath = path.relative(rootDir, key)
        if (relativePath.startsWith(`.mocha-ts${path.sep}`)) {
          delete require.cache[key]
        }
      }
    }
  ]
}

// exports.mochaGlobalSetup = async function () {
//   await rollupBuilder.start()
//   await testBuilder.start()
// }

exports.mochaGlobalTeardown = async function () {
  await testBuilder.close()
  await rollupBuilder.close()

  // I use the sync version of rimraf precisely because it blocks the
  // main thread and thus the mocha watcher, which otherwise would complain
  // about files being deleted
  rimraf.sync(tempDir, { disableGlob: true })
}

function loadPkgToGlobal () {
  const _pkg = require(rootDir)
  if (typeof _pkg === 'function') { // If it is just a default export, load it as named (for compatibility)
    global._pkg = {
      default: _pkg
    }
  } else {
    global._pkg = _pkg
  }
}
