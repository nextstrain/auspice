// Generated with the help of ChatGPT o4-mini-high.
import fs from 'fs';
import glob from 'glob';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { describe, test, expect } from '@jest/globals';

const enTranslationPath = 'src/locales/en/translation.json';
const enSidebarPath = 'src/locales/en/sidebar.json';
const missingTranslationsPath = 'src/locales/en/translations_missing.json';
const missingSidebarPath = 'src/locales/en/sidebar_missing.json';
const extraTranslationsPath = 'src/locales/en/translations_extra.json';
const extraSidebarPath = 'src/locales/en/sidebar_extra.json';

// Collect all keys used in code
const codeKeys = new Set();
const srcFiles = glob.sync('src/**/*.{js,jsx,ts,tsx}');
const variablesPassedToT = new Set();
srcFiles.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const ast = parse(content, { sourceType: 'module', plugins: ['jsx', 'typescript', 'decorators-legacy'] });
  traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === 't' &&
        path.node.arguments.length
      ) {
        if (path.node.arguments[0].type === 'StringLiteral') {
          codeKeys.add(path.node.arguments[0].value);
        } else if (path.node.arguments[0].type === 'Identifier') {
          variablesPassedToT.add(path.node.arguments[0].name);
        }
      }
    },
    JSXAttribute(path) {
      if (
        path.node.name.type === 'JSXIdentifier' &&
        path.node.name.name === 'i18nKey' &&
        path.node.value
      ) {
        if (path.node.value.type === 'StringLiteral') {
          codeKeys.add(path.node.value.value);
        } else if (path.node.value.type === 'Identifier') {
          variablesPassedToT.add(path.node.value.name);
        }
      }
    },
  });
});

// Collect all keys from English translation files
const jsonKeys = new Set();
function addJsonKeys(json, prefix = '') {
  Object.keys(json).forEach((key) => {
    if (key.startsWith('__')) return;
    if (typeof json[key] !== 'string') throw new Error(`Value for key ${prefix ? prefix + ':' : ''}${key} is not a string.`);
    jsonKeys.add(prefix ? `${prefix}:${key}` : key);
  });
}
addJsonKeys(JSON.parse(fs.readFileSync(enTranslationPath, 'utf8')));
addJsonKeys(JSON.parse(fs.readFileSync(enSidebarPath, 'utf8')), 'sidebar');

describe('check key coverage', () => {
  Array.from(codeKeys).forEach((key) => {
    test(`key in code should have an entry in JSON: "${key}"`, () => {
      expect(jsonKeys).toContain(key);
    });
  });

  Array.from(jsonKeys).forEach((key) => {
    test(`key from JSON should be used in code: "${key}"`, () => {
      expect(codeKeys).toContain(key);
    });
  });

  // This is hard to enforce since there are some potential benefits to passing
  // a variable through t(), though the two tests above are only comprehensive
  // if this is actually enforced.
  // Array.from(variablesPassedToT).forEach((arg) => {
  //   test(`variable should not be passed to t function: ${arg}`, () => {
  //     expect(arg).toBe('StringLiteral');
  //   });
  // });
});

writeDiscrepancies();

function writeFile(path, content) {
  fs.writeFileSync(path, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

function writeDiscrepancies() {
  // Write missing keys to files
  const missingKeys = Array.from(codeKeys).filter((key) => !jsonKeys.has(key));
  if (missingKeys.length > 0) {
    const missingTranslations = {};
    const missingSidebar = {};
    missingKeys.forEach((key) => {
      if (key.startsWith('sidebar:')) {
        const sidebarKey = key.split(':')[1];
        missingSidebar[sidebarKey] = sidebarKey;
      } else {
        missingTranslations[key] = key;
      }
    });

    if (Object.keys(missingTranslations).length > 0) {
      writeFile(missingTranslationsPath, missingTranslations);
    }

    if (Object.keys(missingSidebar).length > 0) {
      writeFile(missingSidebarPath, missingSidebar);
    }
  }

  // Write extra keys to files
  const extraKeys = Array.from(jsonKeys).filter((key) => !codeKeys.has(key));
  if (extraKeys.length > 0) {
    const extraTranslations = {};
    const extraSidebar = {};
    extraKeys.forEach((key) => {
      if (key.startsWith('sidebar:')) {
        const sidebarKey = key.split(':')[1];
        extraSidebar[sidebarKey] = sidebarKey;
      } else {
        extraTranslations[key] = key;
      }
    });

    if (Object.keys(extraTranslations).length > 0) {
      writeFile(extraTranslationsPath, extraTranslations);
    }

    if (Object.keys(extraSidebar).length > 0) {
      writeFile(extraSidebarPath, extraSidebar);
    }
  }
}
