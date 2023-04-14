const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

const rollup = require('rollup')
const loadAndParseConfigFile = require('rollup/loadConfigFile').loadConfigFile

const Builder = require('./Builder.cjs')

const rootDir = path.join(__dirname, '../../../../')

const pkgJson = require(path.join(rootDir, 'package.json'))

const mochaTsRelativeDir = pkgJson.directories['mocha-ts']
const mochaTsDir = path.join(rootDir, mochaTsRelativeDir)

class RollupBuilder extends Builder {
  constructor ({ name, configPath, tempDir }) {
    super(path.join(tempDir, 'semaphore'), name)
    this.tempDir = tempDir
    this.configPath = configPath
    this.firstBuild = true
  }

  async start ({ watch = false, commonjs = false }) {
    await super.start()

    this.watch = watch
    this.commonjs = commonjs
    this.watchedModule = commonjs ? pkgJson.exports['.'].node.require.default : pkgJson.exports['.'].node.import.default

    const { options } = await loadAndParseConfigFile(this.configPath)

    // Instead of compiling all the outputs let us just take the one we are using with mocha (either cjs or esm)
    const rollupOptions = options.filter(bundle => {
      const file = (bundle.output[0].dir !== undefined)
        ? path.join(bundle.output[0].dir, bundle.output[0].entryFileNames)
        : bundle.output[0].file
      return file === path.join(rootDir, this.watchedModule)
    })[0]
    if (rollupOptions.output.length > 1) {
      rollupOptions.output = rollupOptions.output[0]
    }

    this.builder = new RollupBundler({ rollupOptions, watch: this.watch, watchedModule: this.watchedModule })

    this.builder.on('event', event => {
      let updateSemaphore = true
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

          // fs.mkdirSync(path.join(this.tempDir, path.dirname(this.watchedModule)), { recursive: true })
          // // console.log(path.join(this.tempDir, path.dirname(this.watchedModule)))
          // fs.copyFileSync(this.watchedModule, path.join(this.tempDir, this.watchedModule))

          if (this.firstBuild) {
            this.firstBuild = false
            updateSemaphore = false
          }
          this.emit('ready', updateSemaphore)
          break

        case 'ERROR':
          if (event.result) event.result.close()
          this.emit('error', event.error)
          fs.writeFileSync(path.join(rootDir, this.watchedModule), '', 'utf8')
          // fs.writeFileSync(path.join(this.tempDir, this.watchedModule), '', 'utf8')
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
  constructor ({ rollupOptions, watchedModule, watch = false }) {
    super()
    this.rollupOptions = rollupOptions
    this.watch = watch
    this.watchedModule = watchedModule
  }

  async start () {
    if (this.watch === true) {
      this.watcher = rollup.watch(this.rollupOptions)

      this.watcher.on('event', event => {
        this.emit('event', event)
      })
    } else {
      if (!fs.existsSync(path.join(rootDir, this.watchedModule))) {
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

exports.RollupBuilder = RollupBuilder
exports.rollupBuilder = new RollupBuilder({
  name: 'rollup',
  configPath: path.join(rootDir, pkgJson.directories.build, 'rollup.config.js'),
  tempDir: mochaTsDir
})
