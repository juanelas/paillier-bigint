import EventEmitter from 'events'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import json5 from 'json5'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

import { rollup as _rollup, watch as _watch } from 'rollup'
import loadAndParseConfigFile from 'rollup/dist/loadConfigFile.js'

import Builder from './Builder.js'

const __dirname = resolve(fileURLToPath(import.meta.url), '../')

const rootDir = join(__dirname, '../../../../')
const pkgJson = json5.parse(readFileSync(join(rootDir, 'package.json')))

export default class RollupBuilder extends Builder {
  constructor ({ name = 'rollup', configPath = join(rootDir, 'rollup.config.js'), tempDir = join(rootDir, '.mocha-ts'), watch = false }) {
    super(join(tempDir, 'semaphore'), name)
    this.configPath = configPath
    this.watch = watch
  }

  async start () {
    await super.start()

    const { options } = await loadAndParseConfigFile(this.configPath)
    // Watch only the Node ESM module, that is the one we are going to use with mocha
    const rollupOptions = options.filter(bundle => {
      const file = (bundle.output[0].dir !== undefined)
        ? join(bundle.output[0].dir, bundle.output[0].entryFileNames)
        : bundle.output[0].file
      return file === join(rootDir, pkgJson.exports['.'].node.import)
    })[0]
    if (rollupOptions.output.length > 1) {
      rollupOptions.output = rollupOptions.output[0]
    }

    this.builder = new RollupBundler(rollupOptions, this.watch)

    this.builder.on('event', event => {
      switch (event.code) {
        case 'START':
          this.emit('busy')
          if (this.firstBuild === true) {
            this.emit('message', 'building your module...')
          } else {
            this.emit('message', 'file changes detected. Rebuilding module files...')
          }
          break

        case 'BUNDLE_END':
          if (event.result) event.result.close()
          break

        case 'END':
          if (event.result) event.result.close()
          this.emit('ready')
          break

        case 'ERROR':
          if (event.result) event.result.close()
          this.emit('error', event.error)
          writeFileSync(join(rootDir, pkgJson.exports['.'].node.import), '', 'utf8')
          this.emit('ready')
          break

        default:
          this.emit('busy')
          break
      }
    })

    this.builder.start()

    return await this.ready()
  }

  async close () {
    await super.close()
    this.builder.close()
  }
}

class RollupBundler extends EventEmitter {
  constructor (rollupOptions, watch = false) {
    super()
    this.rollupOptions = rollupOptions
    this.watch = watch
  }

  async start () {
    if (this.watch === true) {
      this.watcher = _watch(this.rollupOptions)

      this.watcher.on('event', event => {
        this.emit('event', event)
      })
    } else {
      if (existsSync(join(rootDir, pkgJson.exports['.'].node.import)) === false) {
        await this._bundle()
      } else {
        this.emit('event', { code: 'END', noBuild: true })
      }
    }
  }

  async _bundle () {
    this.emit('event', { code: 'START' })
    for (const optionsObj of [].concat(this.rollupOptions)) {
      try {
        const bundle = await _rollup(optionsObj)
        try {
          await Promise.all(optionsObj.output.map(bundle.write))
          this.emit('event', { code: 'BUNDLE_END' })
        } catch (error) {
          this.emit('event', { code: 'ERROR', error })
        }
      } catch (error) {
        this.emit('event', { code: 'ERROR', error })
      }
    }
    this.emit('event', { code: 'END' })
  }

  close () {
    if (this.watcher !== undefined) this.watcher.close()
  }
}
