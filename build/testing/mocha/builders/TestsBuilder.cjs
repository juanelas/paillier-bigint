const path = require('path')
const fs = require('fs')

const ts = require('typescript')
const json5 = require('json5')

const Builder = require('./Builder.cjs')

const rootDir = path.join(__dirname, '../../../../')

const pkgJson = require(path.join(rootDir, 'package.json'))

const mochaTsRelativeDir = pkgJson.directories['mocha-ts']
const mochaTsDir = path.join(rootDir, mochaTsRelativeDir)

const formatHost = {
  getCanonicalFileName: path => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine
}

function fileChecksum (filePath) {
  return require('crypto')
    .createHash('md5')
    .update(fs.readFileSync(filePath, { encoding: 'utf-8' }), 'utf8')
    .digest('hex')
}

function renameJsToCjs (dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const srcFile = path.join(dir, file)
    if (fs.statSync(srcFile).isDirectory()) {
      fileList = renameJsToCjs(srcFile, fileList)
    } else {
      const match = file.match(/(.*)\.js$/)
      if (match !== null) {
        const filename = match[1]
        const dstFile = path.join(dir, `${filename}.cjs`)
        fs.renameSync(srcFile, dstFile)
        const fileContents = fs.readFileSync(dstFile, 'utf8')
        const updatedFileContents = fileContents.replace(/(require\([`'"])(\..*[^.]{5})([`'"])/g, '$1$2.cjs$3')
        fs.writeFileSync(dstFile, updatedFileContents, { encoding: 'utf8' })
      }
    }
  })
}

function fixJsonAssertsInESMTests (dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const srcFile = path.join(dir, file)
    if (fs.statSync(srcFile).isDirectory()) {
      fileList = fixJsonAssertsInESMTests(srcFile, fileList)
    } else {
      const match = file.match(/(.*)\.js$/)
      if (match !== null) {
        const fileContents = fs.readFileSync(srcFile, 'utf8')
        const updatedFileContents = fileContents.replace(/(import\([`'"]\..*\.json[`'"])\)/g, '$1, { assert: { type: "json" } })')
        fs.writeFileSync(srcFile, updatedFileContents, { encoding: 'utf8' })
      }
    }
  })
}

class TestsBuilder extends Builder {
  constructor ({ name, configPath, tempDir }) {
    super(path.join(tempDir, 'semaphore'), name)

    this.tempDir = tempDir

    if (fs.existsSync(configPath) !== true) throw new Error(`Couldn't find a tsconfig file at ${configPath}`)

    this.tsConfigPath = configPath

    this.testFilesChecksums = {}
  }

  async start ({ testFiles = [], commonjs = false }) {
    await super.start()

    this.commonjs = commonjs

    const tsConfig = json5.parse(fs.readFileSync(this.tsConfigPath, 'utf8'))

    if (testFiles.length > 0) {
      delete tsConfig.files
      tsConfig.include = ['build/typings/**/*.d.ts'].concat(testFiles)
      for (let i = 0; i < testFiles.length; i++) {
        this.testFilesChecksums[testFiles[i]] = fileChecksum(testFiles[i])
      }
    } else {
      tsConfig.include = ['build/typings/**/*.d.ts', 'test/**/*', 'src/ts/**/*.spec.ts']
    }
    tsConfig.exclude = ['src/ts/**/!(.spec).ts']

    if (this.commonjs) {
      tsConfig.compilerOptions.module = 'commonjs'
    }
    // "noResolve": true
    // tsConfig.compilerOptions.noResolve = true

    // we don't need declaration files
    tsConfig.compilerOptions.declaration = false

    // we need to emit files
    tsConfig.compilerOptions.noEmit = false

    // source mapping eases debuging
    tsConfig.compilerOptions.inlineSourceMap = true

    tsConfig.compilerOptions.rootDir = '.'

    // Removed typeroots (it causes issues)
    tsConfig.compilerOptions.typeRoots = undefined

    tsConfig.compilerOptions.outDir = path.isAbsolute(this.tempDir) ? path.relative(rootDir, this.tempDir) : this.tempDir

    this.tempTsConfigPath = path.join(rootDir, '.tsconfig.json')

    fs.writeFileSync(this.tempTsConfigPath, JSON.stringify(tsConfig, undefined, 2), { encoding: 'utf-8' })

    const createProgram = ts.createSemanticDiagnosticsBuilderProgram

    const reportDiagnostic = (diagnostic) => {
      const filePath = path.relative(rootDir, diagnostic.file.fileName)
      const tranpiledJsPath = `${path.join(this.tempDir, filePath).slice(0, -3)}.js`
      const errorLine = diagnostic.file.text.slice(0, diagnostic.start).split(/\r\n|\r|\n/).length
      if (fs.existsSync(tranpiledJsPath)) {
        fs.writeFileSync(tranpiledJsPath, '', 'utf8')
      }
      this.emit('error', `[Error ${diagnostic.code}]`, `${filePath}:${errorLine}`, ':', ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()))
    }

    const reportWatchStatusChanged = (diagnostic, newLine, options, errorCount) => {
      if (errorCount !== undefined) {
        // only change semaphore if test files are modified
        let updateSemaphore = false
        for (let i = 0; i < testFiles.length; i++) {
          const checksum = fileChecksum(testFiles[i])
          if (this.testFilesChecksums[testFiles[i]] !== checksum) {
            updateSemaphore = true
            this.testFilesChecksums[testFiles[i]] = checksum
          }
        }
        if (this.commonjs) {
          renameJsToCjs(mochaTsDir)
        } else {
          fixJsonAssertsInESMTests(mochaTsDir)
        }
        this.emit('ready', updateSemaphore)
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

    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.
    this.watcher = ts.createWatchProgram(this.host)
    this.watcher.getProgram()
    return await this.ready()
  }

  async close () {
    await super.close()
    this.watcher.close()
    fs.unlinkSync(this.tempTsConfigPath)
  }
}

exports.TestsBuilder = TestsBuilder
exports.testBuilder = new TestsBuilder({
  name: 'tsc',
  configPath: path.join(rootDir, 'tsconfig.json'),
  tempDir: mochaTsDir
})
