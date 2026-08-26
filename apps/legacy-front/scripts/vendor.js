'use strict';

// Substituto do bower, cujo registro foi descontinuado. As libs vem do npm e
// os .js sao copiados para public/vendor/, que E commitado - assim o front
// roda sem install, como rodava com bower_components versionado.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const modules = path.join(root, 'node_modules');
const dest = path.join(root, 'public', 'vendor');

const FILES = [
  ['angular', 'angular.min.js'],
  ['angular-route', 'angular-route.min.js']
];

if (!fs.existsSync(modules)) {
  console.error('node_modules ausente. Rode `npm install` em apps/legacy-front primeiro.');
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });

for (const [pkg, file] of FILES) {
  const from = path.join(modules, pkg, file);
  const to = path.join(dest, file);

  if (!fs.existsSync(from)) {
    console.error(`nao encontrado: ${path.relative(root, from)}`);
    process.exit(1);
  }

  fs.copyFileSync(from, to);
  console.log(`vendor <- ${pkg}/${file}`);
}
