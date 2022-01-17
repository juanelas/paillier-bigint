const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

const rollup = require('rollup')
const loadAndParseConfigFile = require('rollup/dist/loadConfigFile')

const Builder = require('./Builder.js')

const rootDir = path.join(__dirname, '../../../../')
const pkgJson = require(path.join(rootDir, 'package.json'))

module.exports = class RollupBuilder extends Builder {
  constructor ({ name = 'rollup', configPath = path.join(rootDir, 'rollup.config.js'), tempDir = path.join(rootDir, '.mocha-ts'), watch = false }) {
    super(path.join(tempDir, 'semaphore'), name)
    this.configPath = configPath
    this.watch = watch
  }

  async start () {
    await super.start()

    const { options } = await loadAndParseConfigFile(this.configPath)
    // Watch only the Node CJS module, that is the one we are going to use with mocha
    const rollupOptions = options.filter(bundle => {
      const file = (bundle.output[0].dir !== undefined)
        ? path.join(bundle.output[0].dir, bundle.output[0].entryFileNames)
        : bundle.output[0].file
      return file === path.join(rootDir, pkgJson.main)
    })[0]
    delete rollupOptions.output.pop() // remove the second output

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
          fs.writeFileSync(path.join(rootDir, pkgJson.main), '', 'utf8')
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
      this.watcher = rollup.watch(this.rollupOptions)

      this.watcher.on('event', event => {
        this.emit('event', event)
      })
    } else {
      if (fs.existsSync(path.join(rootDir, pkgJson.main)) === false) {
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
        const bundle = await rollup.rollup(optionsObj)
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
