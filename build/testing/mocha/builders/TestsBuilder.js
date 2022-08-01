import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import json5 from 'json5'
import { isAbsolute, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

import typescript from 'typescript'
import Builder from './Builder.js'

const { sys, createSemanticDiagnosticsBuilderProgram, flattenDiagnosticMessageText, createWatchCompilerHost, createWatchProgram } = typescript

const __dirname = resolve(fileURLToPath(import.meta.url), '../')

const rootDir = join(__dirname, '../../../../')

// const pkgJson = (await import(join(rootDir, 'package.json'), {
//   assert: {
//     type: "json",
//   }
// })).default

const pkgJson = json5.parse(readFileSync(join(rootDir, 'package.json')))

const mochaTsRelativeDir = '.mocha-ts'
const mochaTsDir = join(rootDir, mochaTsRelativeDir)

const formatHost = {
  getCanonicalFileName: path => path,
  getCurrentDirectory: sys.getCurrentDirectory,
  getNewLine: () => sys.newLine
}

export default class TestsBuilder extends Builder {
  constructor ({ name = 'tsc', configPath = join(rootDir, 'tsconfig.json'), tempDir = mochaTsDir }) {
    super(join(tempDir, 'semaphore'), name)

    if (existsSync(configPath) !== true) throw new Error(`Couldn't find a tsconfig file at ${configPath}`)

    this.tempDir = tempDir

    this.tempPkgJsonPath = join(tempDir, 'package.json')

    delete pkgJson.type

    writeFileSync(this.tempPkgJsonPath, JSON.stringify(pkgJson, undefined, 2))

    const tsConfig = json5.parse(readFileSync(configPath, 'utf8'))

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

    tsConfig.compilerOptions.outDir = isAbsolute(tempDir) ? relative(rootDir, tempDir) : tempDir

    this.tempTsConfigPath = join(rootDir, '.tsconfig.json')

    writeFileSync(this.tempTsConfigPath, JSON.stringify(tsConfig, undefined, 2))

    const createProgram = createSemanticDiagnosticsBuilderProgram

    const reportDiagnostic = (diagnostic) => {
      const filePath = relative(rootDir, diagnostic.file.fileName)
      const tranpiledJsPath = `${join(tempDir, filePath).slice(0, -3)}.js`
      const errorLine = diagnostic.file.text.slice(0, diagnostic.start).split(/\r\n|\r|\n/).length
      if (existsSync(tranpiledJsPath)) {
        writeFileSync(tranpiledJsPath, '', 'utf8')
      }
      this.emit('error', `[Error ${diagnostic.code}]`, `${filePath}:${errorLine}`, ':', flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()))
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
    this.host = createWatchCompilerHost(
      this.tempTsConfigPath,
      {},
      sys,
      createProgram,
      reportDiagnostic,
      reportWatchStatusChanged
    )
  }

  async start () {
    await super.start()
    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.
    this.watcher = createWatchProgram(this.host)
    return await this.ready()
  }

  async close () {
    await super.close()
    this.watcher.close()
    unlinkSync(this.tempTsConfigPath)
  }
}
