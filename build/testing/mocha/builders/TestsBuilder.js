const path = require('path')
const fs = require('fs')

const ts = require('typescript')
const JSON5 = require('json5')

const Builder = require('./Builder.js')

const rootDir = path.join(__dirname, '../../../../')
const mochaTsRelativeDir = '.mocha-ts'
const mochaTsDir = path.join(rootDir, mochaTsRelativeDir)

const formatHost = {
  getCanonicalFileName: path => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine
}

module.exports = class TestsBuilder extends Builder {
  constructor ({ name = 'tsc', configPath = path.join(rootDir, 'tsconfig.json'), tempDir = mochaTsDir }) {
    super(path.join(tempDir, 'semaphore'), name)

    if (fs.existsSync(configPath) !== true) throw new Error(`Couldn't find a tsconfig file at ${configPath}`)

    this.tempDir = tempDir

    const tsConfig = JSON5.parse(fs.readFileSync(configPath, 'utf8'))

    tsConfig.file = undefined

    // Exclude already transpiled files in src
    tsConfig.exclude = ['src/ts/**/!(*.spec).ts']

    // "noResolve": true
    tsConfig.compilerOptions.noResolve = false

    // we don't need declaration files
    tsConfig.compilerOptions.declaration = false

    // we need to emit files
    tsConfig.compilerOptions.noEmit = false

    // source mapping eases debuging
    tsConfig.compilerOptions.sourceMap = true

    // This prevents SyntaxError: Cannot use import statement outside a module
    tsConfig.compilerOptions.module = 'commonjs'

    // Removed typeroots (it causes issues)
    tsConfig.compilerOptions.typeRoots = undefined

    tsConfig.compilerOptions.outDir = path.isAbsolute(tempDir) ? path.relative(rootDir, tempDir) : tempDir

    this.tempTsConfigPath = path.join(rootDir, '.tsconfig.json')

    fs.writeFileSync(this.tempTsConfigPath, JSON.stringify(tsConfig, undefined, 2))

    const createProgram = ts.createSemanticDiagnosticsBuilderProgram

    const reportDiagnostic = (diagnostic) => {
      const filePath = path.relative(rootDir, diagnostic.file.fileName)
      const tranpiledJsPath = `${path.join(tempDir, filePath).slice(0, -3)}.js`
      const errorLine = diagnostic.file.text.slice(0, diagnostic.start).split(/\r\n|\r|\n/).length
      if (fs.existsSync(tranpiledJsPath)) {
        fs.writeFileSync(tranpiledJsPath, '', 'utf8')
      }
      this.emit('error', `[Error ${diagnostic.code}]`, `${filePath}:${errorLine}`, ':', ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()))
    }

    const reportWatchStatusChanged = (diagnostic, newLine, options, errorCount) => {
      if (errorCount !== undefined) {
        this.emit('ready')
      } else {
        this.emit('busy')
        if (diagnostic.code === 6031) {
          this.emit('message', 'transpiling your tests...')
        } else if (diagnostic.code === 6032) {
          this.emit('message', 'file changes detected. Transpiling your tests...')
        }
      }
    }

    // Note that there is another overload for `createWatchCompilerHost` that takes
    // a set of root files.
    this.host = ts.createWatchCompilerHost(
      this.tempTsConfigPath,
      {},
      ts.sys,
      createProgram,
      reportDiagnostic,
      reportWatchStatusChanged
    )
  }

  async start () {
    await super.start()
    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.
    this.watcher = ts.createWatchProgram(this.host)
    return await this.ready()
  }

  async close () {
    await super.close()
    this.watcher.close()
    fs.unlinkSync(this.tempTsConfigPath)
  }
}
