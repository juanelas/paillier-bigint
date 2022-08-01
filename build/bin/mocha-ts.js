#! /usr/bin/env node
import { join, resolve } from 'path'
import { fork } from 'child_process'
import minimatch from 'minimatch'
import glob from 'glob'
import { fileURLToPath } from 'url'
const { sync } = glob

const __dirname = resolve(fileURLToPath(import.meta.url), '../')
const rootDir = join(__dirname, '../..')

const mochaTsRelativeDir = '.mocha-ts'

// First let us prepare the args to pass to mocha.
// ts.files will be replaced by their js-transpiled counterparts
// a watch file to our semaphore will be added
const processedArgs = processArgs(process.argv.slice(2))

// Now we can run a script and invoke a callback when complete, e.g.
runScript(join(rootDir, 'node_modules/mocha/bin/mocha'), processedArgs)

function processArgs (args) {
  args = process.argv.slice(2).map(arg => {
    // Let us first remove surrounding quotes in string (it gives issues in windows)
    arg = arg.replace(/^['"]/, '').replace(/['"]$/, '')
    const filenames = sync(arg, { cwd: rootDir, matchBase: true })
    if (filenames.length > 0) {
      return filenames.map(file => {
        const isTsTestFile = minimatch(file, '{test/**/*.ts,src/**/*.spec.ts}', { matchBase: true })
        if (isTsTestFile) {
          return `${mochaTsRelativeDir}/${file.slice(0, -3)}.js`
        }
        return file
      })
    }
    return arg
  })

  const processedArgs = []

  let addSemaphore = false
  let semaphoreAdded = false
  for (const arg of args) {
    if (Array.isArray(arg)) {
      processedArgs.push(...arg)
    } else {
      processedArgs.push(arg)
      if (arg === '--watch' || arg === '-w') {
        addSemaphore = true
      } else if (arg === '--watch-files') {
        processedArgs.push(`${mochaTsRelativeDir}/semaphore`)
        semaphoreAdded = true
      }
    }
  }
  if (addSemaphore === true || semaphoreAdded === false) {
    processedArgs.push('--watch-files')
    processedArgs.push(`${mochaTsRelativeDir}/semaphore`)
  }

  return processedArgs
}

function runScript (scriptPath, args) {
  const mochaCmd = fork(scriptPath, args, {
    cwd: rootDir
  })

  mochaCmd.on('error', (error) => {
    throw error
  })

  // execute the callback once the process has finished running
  mochaCmd.on('exit', function (code) {
    if (code !== 0) {
      throw new Error('exit code ' + code)
    }
  })
}
