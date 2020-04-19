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

function getRepositoryData () {
  if (typeof pkgJson.repository === 'string') {
    const repodata = pkgJson.repository.split(/[:/]/)
    const repoProvider = repodata[0]
    if (repoProvider === 'github' || repoProvider === 'gitlab' || repoProvider === 'bitbucket') {
      return {
        repoProvider,
        repoUsername: repodata[1],
        repoName: repodata[2]
      }
    } else return null
  }
}

const { repoProvider, repoUsername, repoName } = getRepositoryData() || { repoProvider: null, repoUsername: null, repoName: null }

let iifeBundle, esmBundle, workflowBadget, coverallsBadge
if (repoProvider && repoProvider === 'github') {
  iifeBundle = `[IIFE bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/master/lib/index.browser.bundle.iife.js)`
  esmBundle = `[ESM bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/master/lib/index.browser.bundle.mod.js)`
  workflowBadget = `![Node CI](https://github.com/${repoUsername}/${repoName}/workflows/Node%20CI/badge.svg)`
  coverallsBadge = `[![Coverage Status](https://coveralls.io/repos/github/${repoUsername}/${repoName}/badge.svg?branch=master)](https://coveralls.io/github/${repoUsername}/${repoName}?branch=master)`
}

const templateFile = path.join(rootDir, pkgJson.directories.src, 'doc', 'readme-template.md')
let template = fs.readFileSync(templateFile, { encoding: 'UTF-8' })
  .replace(/\{\{PKG_NAME\}\}/g, pkgJson.name)
  .replace(/\{\{PKG_CAMELCASE\}\}/g, camelise(pkgJson.name))
  .replace(/\{\{IIFE_BUNDLE\}\}/g, iifeBundle || 'IIFE bundle')
  .replace(/\{\{ESM_BUNDLE\}\}/g, esmBundle || 'ESM bundle')

if (repoProvider && repoProvider === 'github') {
  template = template.replace(/\{\{GITHUB_ACTIONS_BADGES\}\}/g, workflowBadget + '\n' + coverallsBadge)
}

const input = path.join(rootDir, pkgJson.browser)
// Let us replace bigint literals by standard numbers to avoid issues with bigint
const source = fs.readFileSync(input, { encoding: 'UTF-8' }).replace(/([0-9]+)n([,\s\n)])/g, '$1$2')

const options = {
  source,
  template,
  'heading-depth': 3, // The initial heading depth. For example, with a value of 2 the top-level markdown headings look like "## The heading"
  'global-index-format': 'none' // none, grouped, table, dl.
}

jsdoc2md.clear().then(() => {
  const readmeContents = jsdoc2md.renderSync(options)

  const readmeFile = path.join(rootDir, 'README.md')
  fs.writeFileSync(readmeFile, readmeContents)
})
