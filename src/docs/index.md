[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
{{GITHUB_ACTIONS_BADGES}}

# Skeleton for developing modules for browser and Node.js in Typescript

> This entire section with all its subsections (Installation, Tooling, Scripts) should be removed from your `src/docs/index.md` after installing. The rest of sections may be useful for your package readme, and you may just modified them in `src/docs/index.md` to meet your needs.

This is a skeleton for developing JS modules in Typescript that work both in Node.js and native Javascript. The idea is that you should just focus on developing your typescript code in the `src/ts` folder, and the necessary JS files and bundles will be created so that it can be used with no effort in every environment.

You can use string variable `IS_BROWSER` to create specific code for native JS or Node. For example:

```typescript
if (IS_BROWSER === 'true') {
  // browser specific code here
} else {
  // node.js specific code here
}
```

Besides the actual code, you should create unit testing (mocha+chai) files either in the `test` or the `src/ts` directory, although in the latter case only files ending with `.spec.ts` will be considered as test files.

When creating the tests, you MUST NOT import either `mocha`, `chai` or your package. They have been automatically added to the global scope:

- `mocha` global variable points to mocha,
- `chai` points to chai,
- `_pkg` points to your package (all your exports),
- `_pkgTypes` points to your package typings.

## Installation

Clone this repo to your desired project directory (`my-project` in the following example) and reset the git.

```console
git clone https://github.com/juanelas/node-browser-skel.git my-project
cd my-project
rm -rf .git
git init
git add -A
```

Edit `package.json` to suit your needs and initialize the project with:

```console
npm i
npm update
npm run build
```

The `README.md` file is automatically generated from the `src/docs/index.md` file. EDIT `src/docs/index.md` and rewrite it to your heart's content. Recall removing the section "Skeleton for developing modules for browser and Node.js in Typescript" with all its subsections (Installation, Tooling, Scripts).

## Tooling

- Build: [Rollup](https://rollupjs.org) is used for generating UMD, IIFE, ESM and CJS modules with the corresponding Typescript declaration files and sourcemaps in the `dist` directory.
- Coverage: [Nyc-Istanbul](https://github.com/istanbuljs/nyc) is used to track how well your unit-tests exercise your codebase.
- Doc: [TsCode](https://tsdoc.org/) is used for automatically generating the [API docs](./docs/API.md). Consider documenting your code with TsCode for it to be useful.
- Lint: [ts-stamdard](https://github.com/standard/ts-standard) is the chosen linter, although you can easily change it by any other linter (update `scripts.lint` in the `package.json`). If developing with [Visual Studio Code](https://code.visualstudio.com/), consider installing the [Standard-JS extension](https://marketplace.visualstudio.com/items?itemName=chenxsan.vscode-standardjs) and select `ts-standard` as the `Standard:engine` in the extension settings.
- Test: [Mocha](https://mochajs.org/) with [Chai](https://www.chaijs.com/) running both in Node.js and browser (using [puppeteer](https://pptr.dev/)). Test files should be created assuming that Mocha methods and Chai are declared global, so there is no need to import them (see the provided test examples). There is also no need to create separate test files for browser and Node.js, since every file will be tested against both. Test files are transpiled using [tsc CLI](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

## Scripts

- `npm run build`. Runs the linter (`lint`), builds the JS files (`build:js`), builds the `README.md` and the API doc `./docs/API.md` (`docs`), runs the unit tests in browser (`test:browser`), and creates a coverage report of the tests run in Node.js (`coverage`). See the specific scripts for more details.
- `npm run build:js`. Creates your distributable module files (UMD, IIFE, ESM and CJS), along with the sourcemap and typescript declaration files in the `dist` directory.
- `npm run clean`. Cleans all the artifacts created by the rest of the script (most likely not needed).
- `npm run coverage`. Runs all the unit tests (`src/**/*.spec.ts` and `test/**/*.ts`) in Node.js and track how well they exercise your codebase. Besides the on-screen summary, a complete report in HTML will be generated in the `coverage` directory.
- `npm run docs`. Generates the `README.md` and the API doc `./docs/API.md`. Some labels in the `src/README.md` file will be automatically replaced in the generated `README.md`:

  - &#123;&#123;PKG_NAME&#125;&#125; is automatically replaced with property `name` in `package.json` file.
  - &#123;&#123;PKG_CAMELCASE&#125;&#125; will be replaced by a came case transformation of the package_name.
  - &#123;&#123;IIFE_BUNDLE&#125;&#125; will point to the IIFE bundle file if using github or gitlab as repository.
  - &#123;&#123;ESM_BUNDLE&#125;&#125; will point to the ESM bundle file if using github or gitlab as repository.
  - &#123;&#123;UMD_BUNDLE&#125;&#125; will point to the UMD bundle file if using github or gitlab as repository.
  - It has also some automatically added badges (see the top of this file), that you can remove if desired.

- `npm run lint`. Uses the `ts-standard` linter to fix all the project files. If unconfortable, change the linter for the one of your liking.
- `npm run mocha -- <glob>`. Runs Node.js mocha for the selected tests (use glob pattern). Add `--watch` before the glob to start mocha in watch mode.
- `npm test`. Runs all the unit tests (`src/**/*.spec.ts` and `test/**/*.ts`) in both Node.js and browser (using puppeteer).
- `npm run test:browser`. Runs all the unit tests (`src/**/*.spec.ts` and `test/**/*.ts`) in a browser (using pupppeteer).
- `npm run test:node`. Runs all the unit tests (`src/**/*.spec.ts` and `test/**/*.ts`) in Node.js.
- `npm run watch`. Likely to be the default script during development. Tests are automatically reexecuted whenever a test or source file changes.

# {{PKG_NAME}}

Your package description

## Usage

`{{PKG_NAME}}` can be imported to your project with `npm`:

```console
npm install {{PKG_NAME}}
```

Then either require (Node.js CJS):

```javascript
const {{PKG_CAMELCASE}} = require('{{PKG_NAME}}')
```

or import (JavaScript ES module):

```javascript
import * as {{PKG_CAMELCASE}} from '{{PKG_NAME}}'
```

The appropriate version for browser or node is automatically exported.

You can also download the {{IIFE_BUNDLE}}, the {{ESM_BUNDLE}} or the {{UMD_BUNDLE}} and manually add it to your project, or, if you have already imported `{{PKG_NAME}}` to your project, just get the bundles from `node_modules/{{PKG_NAME}}/dist/bundles/`.

An example of usage could be:

```typescript
YOUR TYPESCRIPT EXAMPLE CODE HERE
```

## API reference documentation

[Check the API](./docs/API.md)
