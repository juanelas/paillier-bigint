import { mkdirSync, writeFileSync } from 'fs'
import ts from 'typescript'
import { join, dirname, extname } from 'path'
import { sync } from 'rimraf'
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const { readJsonConfigFile, sys, parseJsonSourceFileConfigFileContent, createCompilerHost, createProgram } = ts

const rootDir = join(__dirname, '..')
const srcFile = join(rootDir, 'src/ts/index.ts')

const tsConfigPath = join(rootDir, 'tsconfig.json')

const configFile = readJsonConfigFile(tsConfigPath, (file) => {
  return sys.readFile(file)
})

const tsConfig = parseJsonSourceFileConfigFileContent(configFile, sys, dirname(tsConfigPath))

export const compile = (outDir) => {
  const compilerOptions = {
    ...tsConfig.options,
    declaration: true,
    declarationMap: true,
    emitDeclarationOnly: true,
    outDir
  }

  const host = createCompilerHost(compilerOptions)

  host.writeFile = (fileName, contents) => {
    mkdirSync(dirname(fileName), { recursive: true })
    writeFileSync(fileName, contents)

    // we also write the .d.cts types
    let fileName2 = ''
    if (extname(fileName) === '.ts') {
      fileName2 = fileName.slice(0, -2) + 'cts'
    } else { // ext is .d.ts.map
      fileName2 = fileName.slice(0, -6) + 'cts.map'
    }
    writeFileSync(fileName2, contents)
  }

  // Clear the types dir
  sync(outDir)
  // Prepare and emit the d.ts files
  const program = createProgram([srcFile], compilerOptions, host)
  program.emit()
}
