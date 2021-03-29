'use strict'

const fs = require('fs')
const TypeDoc = require('typedoc')
const path = require('path')
const pkgJson = require('../package.json')

const rootDir = path.join(__dirname, '..')

function camelise (str) {
  return str.replace(/-([a-z])/g,
    function (m, w) {
      return w.toUpperCase()
    })
}

async function typedoc () {
  const app = new TypeDoc.Application()

  // If you want TypeDoc to load tsconfig.json / typedoc.json files
  app.options.addReader(new TypeDoc.TSConfigReader())
  app.options.addReader(new TypeDoc.TypeDocReader())

  app.bootstrap({
    // typedoc options here
    entryPoints: ['src/ts/index.ts'],
    plugin: ['typedoc-plugin-markdown'],
    includeVersion: true,
    entryDocument: 'API.md',
    readme: 'none'
  })

  const project = app.convert()

  if (project) {
    // Project may not have converted correctly
    const output = path.join(rootDir, './docs')

    // Rendered docs
    await app.generateDocs(project, output)
  }
}

function getRepositoryData () {
  if (typeof pkgJson.repository === 'string') {
    const repodata = pkgJson.repository.split(/[:/]/)
    const repoProvider = repodata[0]
    if (repoProvider === 'github' || repoProvider === 'gitlab' || repoProvider === 'bitbucket') {
      return {
        repoProvider,
        repoUsername: repodata[1],
        repoName: repodata.slice(2).join('/')
      }
    } else return null
  }
}

const { repoProvider, repoUsername, repoName } = getRepositoryData() || { repoProvider: null, repoUsername: null, repoName: null }

const regex = /^(?:(?<scope>@.*?)\/)?(?<name>.*)/ // We are going to take only the package name part if there is a scope, e.g. @my-org/package-name
const { name } = pkgJson.name.match(regex).groups
const camelCaseName = camelise(name)

let iifeBundle, esmBundle, umdBundle, workflowBadget, coverallsBadge
if (repoProvider) {
  switch (repoProvider) {
    case 'github':
      iifeBundle = `[IIFE bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/master/dist/bundles/${name}.iife.js)`
      esmBundle = `[ESM bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/master/dist/bundles/${name}.esm.js)`
      umdBundle = `[UMD bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/master/dist/bundles/${name}.umd.js)`
      workflowBadget = `[![Node CI](https://github.com/${repoUsername}/${repoName}/workflows/Node%20CI/badge.svg)](https://github.com/${repoUsername}/${repoName}/actions?query=workflow%3A%22Node+CI%22)`
      coverallsBadge = `[![Coverage Status](https://coveralls.io/repos/github/${repoUsername}/${repoName}/badge.svg?branch=master)](https://coveralls.io/github/${repoUsername}/${repoName}?branch=master)`
      break

    case 'gitlab':
      iifeBundle = `[IIFE bundle](https://gitlab.com/${repoUsername}/${repoName}/-/raw/master/dist/bundles/${name}.iife.js?inline=false)`
      esmBundle = `[ESM bundle](https://gitlab.com/${repoUsername}/${repoName}/-/raw/master/dist/bundles/${name}.esm.js?inline=false)`
      umdBundle = `[UMD bundle](https://gitlab.com/${repoUsername}/${repoName}/-/raw/master/dist/bundles/${name}.umd.js?inline=false)`
      break

    default:
      break
  }
}

const templateFile = path.join(rootDir, pkgJson.directories.src, 'docs/index.md')
let template = fs.readFileSync(templateFile, { encoding: 'UTF-8' })
  .replace(/\{\{PKG_NAME\}\}/g, pkgJson.name)
  .replace(/\{\{PKG_CAMELCASE\}\}/g, camelCaseName)
  .replace(/\{\{IIFE_BUNDLE\}\}/g, iifeBundle || 'IIFE bundle')
  .replace(/\{\{ESM_BUNDLE\}\}/g, esmBundle || 'ESM bundle')
  .replace(/\{\{UMD_BUNDLE\}\}/g, umdBundle || 'UMD bundle')

if (repoProvider && repoProvider === 'github') {
  template = template.replace(/\{\{GITHUB_ACTIONS_BADGES\}\}/g, workflowBadget + '\n' + coverallsBadge)
} else {
  template = template.replace(/\{\{GITHUB_ACTIONS_BADGES\}\}/g, '')
}

const readmeFile = path.join(rootDir, 'README.md')
fs.writeFileSync(readmeFile, template)

typedoc()
