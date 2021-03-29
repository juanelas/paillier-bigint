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

    const readFileAndMangle = (path) => { // We need to change the include or file in the original file to only compile the tests
      const fileStr = fs.readFileSync(path, 'utf8')
      const config = JSON5.parse(fileStr)
      if (config.file) delete config.file
      config.include.push('node_modules/**/*.d.ts')
      config.compilerOptions.module = 'commonjs'
      return JSON.stringify(config)
    }
    const configFile = ts.readJsonConfigFile(configPath, readFileAndMangle)

    const parsedTsConfig = ts.parseJsonSourceFileConfigFileContent(configFile, ts.sys, path.dirname(configPath))

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
      parsedTsConfig.fileNames,
      {
        ...parsedTsConfig.options,
        rootDir,
        outDir: this.tempDir,
        noEmit: false,
        noResolve: true,
        sourceMap: true
      },
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
  }
}
