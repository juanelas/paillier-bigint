const fs = require('fs')
const ts = require('typescript')
const path = require('path')
const pkgJson = require('../package.json')

const rootDir = path.join(__dirname, '..')
const jsFile = path.join(rootDir, pkgJson.browser)
const dtsFile = path.join(rootDir, pkgJson.types)

const compilerOptions = {
  declaration: true,
  noEmit: false,
  emitDeclarationOnly: true,
  allowJs: true
}

const host = ts.createCompilerHost(compilerOptions)

host.writeFile = (fileName, contents) => {
  fs.writeFileSync(dtsFile, contents)
}

// Prepare and emit the d.ts files
const program = ts.createProgram([jsFile], compilerOptions, host)
program.emit()
