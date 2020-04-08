'use strict'

const fs = require('fs')
const jsdoc2md = require('jsdoc-to-markdown')
const path = require('path')
const pkgJson = require('../package.json')

const rootDir = path.join(__dirname, '..')

function camelise (str) {
  return str.replace(/-([a-z])/g,
    function (m, w) {
      return w.toUpperCase()
    })
}

const templateFile = path.join(rootDir, pkgJson.directories.src, 'doc', 'readme-template.md')
const template = fs.readFileSync(templateFile, { encoding: 'UTF-8' })
  .replace(/\{\{PKG_NAME\}\}/g, pkgJson.name)
  .replace(/\{\{PKG_CAMELCASE\}\}/g, camelise(pkgJson.name))
  .replace(/\{\{IIFE_BUNDLE\}\}/g, 'IIFE bundle')
  .replace(/\{\{ESM_BUNDLE\}\}/g, 'ES6 bundle module')

const input = path.join(rootDir, pkgJson.directories.lib, 'index.browser.mod.js')
// Let us replace bigint literals by standard numbers to avoid issues with bigint
const source = fs.readFileSync(input, { encoding: 'UTF-8' }).replace(/([0-9]+)n([,\s\n)])/g, '$1$2')

const options = {
  source,
  template,
  'heading-depth': 3 // The initial heading depth. For example, with a value of 2 the top-level markdown headings look like "## The heading"
  // 'global-index-format': 'none' // none, grouped, table, dl.
}

jsdoc2md.clear().then(() => {
  const readmeContents = jsdoc2md.renderSync(options)

  const readmeFile = path.join(rootDir, 'README.md')
  fs.writeFileSync(readmeFile, readmeContents)
})
