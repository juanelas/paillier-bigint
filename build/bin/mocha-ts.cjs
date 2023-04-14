#! /usr/bin/env node
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const minimatch = require('minimatch').minimatch
const rimraf = require('rimraf')
const runScript = require('../run-script.cjs')

const rootDir = path.join(__dirname, '../..')

const pkgJson = require(path.join(rootDir, 'package.json'))

const mochaTsRelativeDir = pkgJson.directories['mocha-ts']
const mochaTsDir = path.join(rootDir, mochaTsRelativeDir)

// clean .mocha-ts directory
rimraf.sync(mochaTsDir)

const semaphorePath = `${mochaTsRelativeDir}/semaphore`

const tempDir = mochaTsDir
fs.mkdirSync(tempDir, { recursive: true })

const usage = `Usage: mocha-ts [options] [spec]

mocha against ts tests and modules

Arguments:
  spec              One or more files, directories, or globs to test (default:
                    "{src/ts/**/*.spec.ts,test/**/*.ts}")

Options:
  -w, --watch       run in watch mode. Since mocha only supports CJS in watch
                    mode. This option implies -cjs as well (default: false)
  -cjs, --commonjs  run tests against the CJS bundle instead of the ESM one 
                    (default: false)
  -h, --help        display help for command

`

function parse () {
  const args = process.argv.slice(2)

  const help = getBooleanOption(args, '--help', '-h')
  if (help) {
    console.log(usage)
    process.exit()
  }

  const requiredFile = getOption(args, '--require')

  const watch = getBooleanOption(args, '--watch', '-w')

  const commonjs = getBooleanOption(args, '--commonjs', '-cjs')
  if (commonjs === false && watch === true) {
    console.log('ERROR: mocha in watch mode only supports commonjs')
    console.log(usage)
    process.exit(1)
  }

  let testsGlob = args.pop()
  if (testsGlob === undefined) {
    testsGlob = '{src/ts/**/*.spec.ts,test/**/*.ts}'
  } else {
    testsGlob = testsGlob.replace(/^['"]/, '').replace(/['"]$/, '') // Let us remove surrounding quotes in string (it gives issues in windows)
  }

  const mochaArgs = []

  if (requiredFile !== '') {
    mochaArgs.push('--require')
    mochaArgs.push(requiredFile)
  }
  mochaArgs.push('--require')
  mochaArgs.push('build/testing/mocha/mocha-init.cjs')

  if (watch) {
    mochaArgs.push('-w')
    mochaArgs.push('--watch-files')
    mochaArgs.push(semaphorePath)
  }

  if (testsGlob.substring(0, 1) === '-') {
    console.log(usage)
    process.exit(9)
  }
  let filenames = []
  try {
    filenames = glob.sync(testsGlob, { cwd: rootDir, matchBase: true })
  } catch (error) {}
  if (filenames.length === 0) {
    console.error('invalid or empty glob pattern: ' + testsGlob)
    console.log()
    console.log(usage)
    process.exit(9)
  }

  const testFiles = []
  const jsTestFiles = []

  if (filenames.length > 0) {
    filenames.forEach(file => {
      const isTsTestFile = minimatch(file, '{test/**/*.ts,src/**/*.spec.ts}', { matchBase: true })
      if (isTsTestFile) {
        testFiles.push(file)
        const extension = commonjs ? 'cjs' : 'js'
        jsTestFiles.push(`${mochaTsRelativeDir}/${file.slice(0, -3)}.${extension}`)
      }
    })
  }
  mochaArgs.push(...jsTestFiles)

  return {
    mochaArgs,
    testFiles,
    commonjs
  }
}

const processedArgs = parse()
const commonjs = processedArgs.commonjs
const testFiles = processedArgs.testFiles
const mochaArgs = processedArgs.mochaArgs

// prepare setup for mocha (it should be written to a JSON file that will be loaded by the mocha-init.cjs)
const mochaSetup = {
  testFiles,
  commonjs
}
fs.writeFileSync(path.join(tempDir, 'testSetup.json'), JSON.stringify(mochaSetup, undefined, 2), { encoding: 'utf-8' })

if (commonjs) {
  console.log('\x1b[33mℹ [mocha-ts] Running tests against the CommonJS module \x1b[0m\n')
} else {
  console.log('\x1b[33mℹ [mocha-ts] Running tests against the ESM module \x1b[0m\n')
}

const rollupBuilder = require('../testing/mocha/builders/RollupBuilder.cjs').rollupBuilder

rollupBuilder.start({ commonjs, watch: false }).then(() => {
  rollupBuilder.close()
  const testsBuilder = require('../testing/mocha/builders/TestsBuilder.cjs').testBuilder
  testsBuilder.start({ commonjs, testFiles }).then(() => {
    testsBuilder.close()
    // Now run mocha
    runScript(path.join(rootDir, 'node_modules/mocha/bin/mocha'), mochaArgs)
  })
})

function getBooleanOption (args, ...optionNames) {
  let found = false
  optionNames.forEach((option) => {
    const index = args.indexOf(option)
    if (index > -1) {
      found = true
      args.splice(index, 1)
    }
  })
  return found
}

function getOption (args, option) {
  const index = args.indexOf(option)
  if (index > -1 && index < args.length - 2) {
    return args.splice(index, 2)[1]
  }
  return ''
}
