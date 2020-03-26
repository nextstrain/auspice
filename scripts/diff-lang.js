#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

main();

/* -------------------------------------------------------------- */

function main() {
  const en = {
    sidebar: readJson('en', 'sidebar'),
    translation: readJson('en', 'translation')
  };

  const langs = getLangsToDiff();
  // console.log(`Comparing english with language ${langs.map((l) => `"${l.toUpperCase()}"`).join(", ")}\n\n`);

  for (const lang of langs) {
    for (const jsonName of ['sidebar', 'translation']) {
      console.log(`${lang.toUpperCase()}: comparing ${jsonName}.json against the English translation`);
      diff(en[jsonName], readJson(lang, jsonName));
    }
  }
}

function getLangsToDiff() {
  const args = process.argv.slice(2);
  if (args.length) return args;
  const localesDir = path.join(path.basename(__dirname), '..', 'src', 'locales');
  return fs.readdirSync(localesDir)
    .filter((file) => fs.statSync(path.join(localesDir, file)).isDirectory())
    .filter((file) => file !== 'en');
}

function diff(enJson, newJson) {
  const enKeysSet = new Set(Object.keys(enJson));
  const newKeysSet = new Set(Object.keys(newJson));

  /* english-only keys */
  const enOnlyKeys = [...enKeysSet].filter((k) => !newKeysSet.has(k));
  if (enOnlyKeys.length) {
    console.log("\tFollowing keys need to be added:");
    enOnlyKeys.forEach((k) => console.log(`\t\t"${k}"`));
  }

  /* lang-only keys */
  const langOnlyKeys = [...newKeysSet].filter((k) => !enKeysSet.has(k));
  if (langOnlyKeys.length) {
    console.log("\tFollowing keys are present but should be removed as they are no longer used:");
    langOnlyKeys.forEach((k) => console.log(`\t\t"${k}"`));
  }

  /* lang-only keys */
  const keysStillEn = [...enKeysSet].filter((k) => newKeysSet.has(k) && newJson[k]===enJson[k]);
  if (keysStillEn.length) {
    console.log("\tFollowing keys are identical to the English version & may need to be translated:");
    keysStillEn.forEach((k) => console.log(`\t\t"${k}"`));
  }
}

function readJson(lang, name) {
  const p = path.join(path.basename(__dirname), '..', 'src', 'locales', lang, name+'.json');
  const f = fs.readFileSync(p, 'utf8');
  const j= JSON.parse(f);
  return Object.keys(j)
    .filter((key) => !key.startsWith('__'))
    .reduce((newObj, key) => {
      newObj[key]=j[key];
      return newObj;
    }, {});
}
