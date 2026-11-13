const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..');
const source = readFileSync(resolve(root, 'iwara-plus.user.js'), 'utf8');
const header = source.match(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!header) throw new Error('Userscript metadata not found');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
if (header[0].match(/@version\s+(\S+)/)?.[1] !== pkg.version) throw new Error('Version mismatch');
writeFileSync(resolve(root, 'iwara-plus.meta.js'), header[0] + '\n');
