'use strict';

const rollup = require('rollup');
const minify = require('rollup-plugin-babel-minify');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const fs = require('fs');
const path = require('path');
const pkgJson = require('../package.json');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const dstDir = path.join(rootDir, 'dist');

const buildOptions = [
    { // Browser
        input: {
            input: path.join(srcDir, 'main.js'),
            plugins: [
                replace({
                    'process.browser': true
                }),
                resolve({browser: true})
            ]
        },
        output: {
            file: path.join(dstDir, `${pkgJson.name}-${pkgJson.version}.browser.js`),
            format: 'iife',
            name: camelise(pkgJson.name)
        }
    },
    { // Browser minified
        input: {
            input: path.join(srcDir, 'main.js'),
            plugins: [
                replace({
                    'process.browser': true
                }),
                resolve({browser: true}),
                minify({
                    'comments': false
                })
            ],
        },
        output: {
            file: path.join(dstDir, `${pkgJson.name}-${pkgJson.version}.browser.min.js`),
            format: 'iife',
            name: camelise(pkgJson.name)
        }
    },
    { // Browser esm
        input: {
            input: path.join(srcDir, 'main.js'),
            plugins: [
                replace({
                    'process.browser': true
                }),
                resolve({browser: true})
            ]
        },
        output: {
            file: path.join(dstDir, `${pkgJson.name}-${pkgJson.version}.browser.mod.js`),
            format: 'esm'
        }
    },
    { // Browser esm minified
        input: {
            input: path.join(srcDir, 'main.js'),
            plugins: [
                replace({
                    'process.browser': true
                }),
                resolve({browser: true}),
                minify({
                    'comments': false
                })
            ],
        },
        output: {
            file: path.join(dstDir, `${pkgJson.name}-${pkgJson.version}.browser.mod.min.js`),
            format: 'esm'
        }
    },
    { // Node
        input: {
            input: path.join(srcDir, 'main.js'),
            plugins: [
                replace({
                    'process.browser': false
                })
            ]
        },
        output: {
            file: path.join(dstDir, `${pkgJson.name}-${pkgJson.version}.node.js`),
            format: 'cjs'
        }
    }
];

for (const options of buildOptions) {
    build(options);
}


/* --- HELPLER FUNCTIONS --- */

async function build(options) {
    // create a bundle
    const bundle = await rollup.rollup(options.input);

    // generate code
    await bundle.generate(options.output);

    // or write the bundle to disk
    await bundle.write(options.output);

    // copy the latest build as pkg_name-latest
    fs.copyFileSync(
        options.output.file,
        options.output.file.replace(`${pkgJson.name}-${pkgJson.version}.`, `${pkgJson.name}-latest.`)
    );
}

function camelise(str) {
    return str.replace(/-([a-z])/g,
        function (m, w) {
            return w.toUpperCase();
        });
}