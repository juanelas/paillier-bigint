'use strict'

const fs = require('fs')
const TypeDoc = require('typedoc')
const path = require('path')
const json5 = require('json5')
const pkgJson = require('../package.json')
const rimraf = require('rimraf')

const rootDir = path.join(__dirname, '..')

const templateFilePath = path.join(rootDir, pkgJson.directories.src, 'docs/index.md')
let template = fs.readFileSync(templateFilePath, { encoding: 'utf-8' })

async function main () {
  // Generate API doc with typedoc
  await typedoc()

  // Translate relaitive links to project's root
  replaceRelativeLinks()

  // Let us replace variables and badges
  variableReplacements()

  const readmeFile = path.join(rootDir, 'README.md')
  fs.writeFileSync(readmeFile, template)
}

main()
/* ------------------------------------------------------------------------- |
|                               UTILITY FUNCTIONS                            |
| ------------------------------------------------------------------------- */

function camelise (str) {
  return str.replace(/-([a-z])/g,
    function (m, w) {
      return w.toUpperCase()
    })
}

async function typedoc () {
  const app = new TypeDoc.Application()

  // prepare tsconfig
  const tsConfigPath = path.join(rootDir, 'tsconfig.json')
  const tempTsConfigPath = path.join(rootDir, '.tsconfig.json')

  const tsConfig = json5.parse(fs.readFileSync(tsConfigPath, 'utf8'))
  tsConfig.include = ['src/ts/**/*', 'build/typings/**/*.d.ts']
  tsConfig.exclude = ['src/**/*.spec.ts']
  fs.writeFileSync(tempTsConfigPath, JSON.stringify(tsConfig, undefined, 2))

  // If you want TypeDoc to load tsconfig.json / typedoc.json files
  app.options.addReader(new TypeDoc.TSConfigReader())
  // app.options.addReader(new TypeDoc.TypeDocReader())

  app.bootstrap({
    // typedoc options here
    tsconfig: tempTsConfigPath,
    entryPoints: ['src/ts/index.ts'],
    plugin: ['typedoc-plugin-markdown'],
    includeVersion: true,
    entryDocument: 'API.md',
    readme: 'none',
    hideBreadcrumbs: true,
    excludePrivate: true
  })

  const project = app.convert()

  if (project) {
    // Project may not have converted correctly
    const output = path.join(rootDir, './docs')

    // Rendered docs
    await app.generateDocs(project, output)
  }

  rimraf.sync(tempTsConfigPath)
}

function getRepositoryData () {
  let ret
  if (typeof pkgJson.repository === 'string') {
    const repodata = pkgJson.repository.split(/[:/]/)
    const repoProvider = repodata[0]
    if (repoProvider === 'github' || repoProvider === 'gitlab' || repoProvider === 'bitbucket') {
      ret = {
        repoProvider,
        repoUsername: repodata[1],
        repoName: repodata.slice(2).join('/')
      }
    }
  } else if (typeof pkgJson.repository === 'object' && pkgJson.repository.type === 'git' && pkgJson.repository.url !== 'undefined') {
    const regex = /(?:.+?\+)?http[s]?:\/\/(?<repoProvider>[\w._-]+)\.\w{2,3}\/(?<repoUsername>[\w._-]+)\/(?<repoName>[\w._\-/]+?)\.git/
    const match = pkgJson.repository.url.match(regex)
    ret = {
      repoProvider: match[1],
      repoUsername: match[2],
      repoName: match[3],
      repoDirectory: pkgJson.repository.directory
    }
  }
  if (typeof ret === 'object') {
    if (typeof pkgJson.nodeBrowserSkel === 'object' && typeof pkgJson.nodeBrowserSkel.git === 'object' && typeof pkgJson.nodeBrowserSkel.git.branch === 'string') {
      ret.branch = pkgJson.nodeBrowserSkel.git.branch
    } else {
      ret.branch = (ret.repoProvider === 'github') ? 'main' : 'master'
    }
  }
  return ret
}

function variableReplacements () {
  const { repoProvider, repoUsername, repoName, repoDirectory, branch } = getRepositoryData() || {}

  const regex = /^(?:(?<scope>@.*?)\/)?(?<name>.*)/ // We are going to take only the package name part if there is a scope, e.g. @my-org/package-name
  const { name } = pkgJson.name.match(regex).groups
  const camelCaseName = camelise(name)

  const iifeBundlePath = pkgJson.exports['./iife-browser-bundle'] !== undefined ? path.relative('.', pkgJson.exports['./iife-browser-bundle']) : undefined
  const esmBundlePath = pkgJson.exports['./esm-browser-bundle'] !== undefined ? path.relative('.', pkgJson.exports['./esm-browser-bundle']) : undefined
  const umdBundlePath = pkgJson.exports['./umd-browser-bundle'] !== undefined ? path.relative('.', pkgJson.exports['./umd-browser-bundle']) : undefined

  let useWorkflowBadge = false
  let useCoverallsBadge = false
  if (pkgJson.nodeBrowserSkel !== undefined && pkgJson.nodeBrowserSkel.badges !== undefined) {
    if (pkgJson.nodeBrowserSkel.badges.workflow === true) {
      useWorkflowBadge = true
    }
    if (pkgJson.nodeBrowserSkel.badges.coveralls === true) {
      useCoverallsBadge = true
    }
  }

  let iifeBundle, esmBundle, umdBundle, workflowBadge, coverallsBadge

  if (repoProvider) {
    switch (repoProvider) {
      case 'github':
        iifeBundle = iifeBundlePath !== undefined ? `[IIFE bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/${branch}/${repoDirectory !== undefined ? repoDirectory + '/' : ''}${iifeBundlePath})` : undefined
        esmBundle = esmBundlePath !== undefined ? `[ESM bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/${branch}/${repoDirectory !== undefined ? repoDirectory + '/' : ''}${esmBundlePath})` : undefined
        umdBundle = umdBundlePath !== undefined ? `[UMD bundle](https://raw.githubusercontent.com/${repoUsername}/${repoName}/${branch}/${repoDirectory !== undefined ? repoDirectory + '/' : ''}${umdBundlePath})` : undefined
        workflowBadge = useWorkflowBadge ? `[![Node.js CI](https://github.com/${repoUsername}/${repoName}/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/${repoUsername}/${repoName}/actions/workflows/build-and-test.yml)` : undefined
        coverallsBadge = useCoverallsBadge ? `[![Coverage Status](https://coveralls.io/repos/github/${repoUsername}/${repoName}/badge.svg?branch=${branch})](https://coveralls.io/github/${repoUsername}/${repoName}?branch=${branch})` : undefined
        break

      case 'gitlab':
        iifeBundle = iifeBundlePath !== undefined ? `[IIFE bundle](https://gitlab.com/${repoUsername}/${repoName}/-/raw/${branch}/${repoDirectory !== undefined ? repoDirectory + '/' : ''}${iifeBundlePath}?inline=false)` : undefined
        esmBundle = esmBundlePath !== undefined ? `[ESM bundle](https://gitlab.com/${repoUsername}/${repoName}/-/raw/${branch}/${repoDirectory !== undefined ? repoDirectory + '/' : ''}${esmBundlePath}?inline=false)` : undefined
        umdBundle = umdBundlePath !== undefined ? `[UMD bundle](https://gitlab.com/${repoUsername}/${repoName}/-/raw/${branch}/${repoDirectory !== undefined ? repoDirectory + '/' : ''}${umdBundlePath}?inline=false)` : undefined
        break

      default:
        break
    }
  }

  template = template
    .replace(/\{\{PKG_NAME\}\}/g, pkgJson.name)
    .replace(/\{\{PKG_LICENSE\}\}/g, pkgJson.license.replace('-', '_'))
    .replace(/\{\{PKG_DESCRIPTION\}\}/g, pkgJson.description)
    .replace(/\{\{PKG_CAMELCASE\}\}/g, camelCaseName)
    .replace(/\{\{IIFE_BUNDLE\}\}/g, iifeBundle || 'IIFE bundle')
    .replace(/\{\{ESM_BUNDLE\}\}/g, esmBundle || 'ESM bundle')
    .replace(/\{\{UMD_BUNDLE\}\}/g, umdBundle || 'UMD bundle')

  if (repoProvider && repoProvider === 'github') {
    template = template.replace(/\{\{GITHUB_ACTIONS_BADGES\}\}\n/gs, (workflowBadge ? `${workflowBadge}\n` : '') + (coverallsBadge ? `${coverallsBadge}\n` : ''))
  } else {
    template = template.replace(/\{\{GITHUB_ACTIONS_BADGES\}\}\n/gs, '')
  }
}

function replaceRelativeLinks () {
  const replacements = []
  const relativePathRegex = /(\[[\w\s\d]+\]\()(?!(?:http:\/\/)|(?:https:\/\/))([\w\d;,/?:@&=+$-_.!~*'()\\#]+)\)/g
  const matches = template.matchAll(relativePathRegex)
  if (matches) {
    for (const match of matches) {
      const index = (match.index ?? 0) + match[1].length
      const filepath = match[2]
      if (!path.isAbsolute(filepath)) {
        const absoluteFilePath = path.join(path.dirname(templateFilePath), filepath)
        if (!fs.existsSync(absoluteFilePath)) {
          console.warn(`File ${absoluteFilePath} is linked in your index.md but it does not exist. Ignoring`)
        } else {
          const replacement = path.relative(rootDir, absoluteFilePath)
          replacements.push({ index, length: filepath.length, replacement })
        }
      }
    }
    const sortedReplacements = replacements.sort((a, b) => a.index - b.index)
    let ret = ''
    let index = 0
    for (const replacement of sortedReplacements) {
      ret += template.slice(index, replacement.index)
      ret += replacement.replacement
      index = replacement.index + replacement.length
    }
    ret += template.slice(index)
    template = ret
  }
}
