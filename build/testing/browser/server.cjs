'use strict'

const fs = require('fs')
const http = require('http')
const path = require('path')
const pkgJson = require('../../../package.json')
require('dotenv').config()

const rollup = require('rollup')
const resolve = require('@rollup/plugin-node-resolve').nodeResolve
const replace = require('@rollup/plugin-replace')
const multi = require('@rollup/plugin-multi-entry')
const typescriptPlugin = require('@rollup/plugin-typescript')
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')

const rootDir = path.join(__dirname, '..', '..', '..')

const regex = /^(?:(?<scope>@.*?)\/)?(?<name>.*)/ // We are going to take only the package name part if there is a scope, e.g. @my-org/package-name
const { name } = pkgJson.name.match(regex).groups

const indexHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>${name}</title>
    <script src="/mocha.js"></script>
    <script src="/chai.js"></script>
  </head>

  <body>

  </body>
    <div id="mocha"></div>
    <script>
      mocha.setup({
        ui: 'bdd',
        reporter: 'spec',
        color: 'true',
        timeout: 90000
      })
    </script>
    <script type="module">
      import * as _pkg from './${name}.esm.js'
      self._pkg = _pkg
    </script>
    <script type="module">
      import './tests.js'
      window._mocha = mocha.run()
    </script>
  </html>`

const tsBundleOptions = {
  tsconfig: path.join(rootDir, 'tsconfig.json'),
  outDir: undefined // ignore outDir in tsconfig.json
}

async function buildTests (testFiles) {
  // create a bundle
  const input = testFiles ?? [path.join(rootDir, pkgJson.directories.test, '**/*.ts'), path.join(rootDir, pkgJson.directories.src, '**/*.spec.ts')]
  const inputOptions = {
    input,
    plugins: [
      multi({ exports: true }),
      replace({
        IS_BROWSER: true,
        preventAssignment: true
      }),
      typescriptPlugin(tsBundleOptions),
      resolve({
        browser: true,
        exportConditions: ['browser', 'module', 'import', 'default']
      }),
      commonjs(),
      json()
    ],
    external: [pkgJson.name]
  }
  const bundle = await rollup.rollup(inputOptions)
  const { output } = await bundle.generate({ format: 'esm' })
  await bundle.close()
  let bundledCode = output[0].code
  const replacements = _getEnvVarsReplacements(bundledCode)
  for (const replacement in replacements) {
    bundledCode = bundledCode.replaceAll(replacement, replacements[replacement])
  }
  return bundledCode
}

class TestServer {
  constructor () {
    this.server = http.createServer()
  }

  async init (testFiles) {
    const tests = await buildTests(testFiles)
    this.server.on('request', function (req, res) {
      if (req.url === `/${name}.esm.js`) {
        fs.readFile(path.join(rootDir, pkgJson.directories.dist, 'bundles/esm.js'), function (err, data) {
          if (err) {
            res.writeHead(404)
            res.end(JSON.stringify(err))
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/javascript' })
          res.end(data)
        })
      } else if (req.url === '/index.html' || req.url === '/') {
        res.writeHead(200)
        res.end(indexHtml)
      } else if (req.url === '/tests.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' })
        res.end(tests)
      } else if (req.url === '/mocha.js') {
        fs.readFile(path.join(rootDir, 'node_modules/mocha/mocha.js'), function (err, data) {
          if (err) {
            res.writeHead(404)
            res.end(JSON.stringify(err))
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/javascript' })
          res.end(data)
        })
      } else if (req.url === '/chai.js' || req.url === '/chai') {
        fs.readFile(path.join(rootDir, 'node_modules/chai/chai.js'), function (err, data) {
          if (err) {
            res.writeHead(404)
            res.end(JSON.stringify(err))
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/javascript' })
          res.end(data)
        })
      } else {
        res.writeHead(404)
        res.end()
      }
    })
  }

  listen (port = 38080) {
    return new Promise((resolve, reject) => {
      this.server.listen(port, error => {
        if (error) return reject(error)
        console.log(`Testing server listenning at http://localhost:${port}`)
        return resolve()
      })
    })
  }

  close () {
    return new Promise((resolve, reject) => {
      this.server.close(error => (error) ? reject(error) : resolve())
    })
  }
}

function _getEnvVarsReplacements (testsCode) {
  const replacements = {}
  const missingEnvVars = []
  for (const match of testsCode.matchAll(/process\.env\.(\w+)/g)) {
    const envVar = match[1]
    if (process.env[envVar] !== undefined) {
      replacements[match[0]] = '`' + process.env[envVar] + '`'
    } else {
      missingEnvVars.push(envVar)
    }
  }
  for (const match of testsCode.matchAll(/process\.env\[['"](\w+)['"]\]/g)) {
    const envVar = match[1]
    if (process.env[envVar] !== undefined) {
      replacements[match[0]] = '`' + process.env[envVar] + '`'
    } else {
      missingEnvVars.push(envVar)
    }
  }
  if (missingEnvVars.length > 0) {
    throw EvalError('The folloinwg environment variables are missing in your .env file: ' + missingEnvVars)
  }
  return replacements
}

exports.server = new TestServer()
