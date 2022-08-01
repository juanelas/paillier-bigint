'use strict'

import { join, resolve } from 'path'
import { readFileSync } from 'fs'
import json5 from 'json5'
import chai from 'chai'
import rimraf from 'rimraf'
import { fileURLToPath } from 'url'
import RollupBuilder from './builders/RollupBuilder.js'
import TestsBuilder from './builders/TestsBuilder.js'
import 'dotenv/config'

const __dirname = resolve(fileURLToPath(import.meta.url), '../')

const rootDir = join(__dirname, '../../../')

const pkgJson = json5.parse(readFileSync(join(rootDir, 'package.json')))

global.chai = chai

async function reloadModule () {
  const _pkg = await import(join(rootDir, pkgJson.exports['.'].node.import + `?update=${Date.now()}`))
  global._pkg = _pkg
  // if (typeof _pkg === 'function') { // If it is just a default export, load it as named (for compatibility)
  //   global._pkg = {
  //     default: _pkg
  //   }
  // } else {
  //   global._pkg = _pkg
  // }
}

reloadModule()

global.IS_BROWSER = false

const watch = process.argv.includes('--watch') || process.argv.includes('-w')

const tempDir = join(rootDir, '.mocha-ts')

const rollupBuilder = new RollupBuilder({ name: 'rollup', configPath: join(rootDir, 'build/rollup.config.js'), tempDir, watch })
const testBuilder = new TestsBuilder({ name: 'tsc', tempDir })

rollupBuilder.start() // This should be in exports.mochaGlobalSetup but mocha fails when not in watch mode (DIRT...)
testBuilder.start() // This should be in exports.mochaGlobalSetup but mocha fails when not in watch mode (DIRT...)

export const mochaHooks = {
  beforeAll: [
    async function () {
      this.timeout('120000')

      await Promise.all([rollupBuilder.ready(), testBuilder.ready()])

      // Just in case our module had been modified. Reload it when the tests are repeated (for mocha watch mode).
      // delete require.cache[require.resolve(rootDir)]
      await reloadModule()

      // And now reset any other transpiled module (just delete the cache so it is fully reloaded)
      // for (const key in require.cache) {
      //   const relativePath = relative(rootDir, key)
      //   if (relativePath.startsWith(`.mocha-ts${sep}`)) {
      //     delete require.cache[key]
      //   }
      // }
    }
  ]
}

// exports.mochaGlobalSetup = async function () {
//   await rollupBuilder.start()
//   await testBuilder.start()
// }

export const mochaGlobalTeardown = async function () {
  await testBuilder.close()
  await rollupBuilder.close()

  // I use the sync version of rimraf precisely because it blocks the
  // main thread and thus the mocha watcher, which otherwise would complain
  // about files being deleted
  rimraf.sync(tempDir, { disableGlob: true })
}
