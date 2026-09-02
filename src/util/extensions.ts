// TODO: Add typing for individual extensions.
// See docs/customise-client/api.rst.
type Extensions = {
  [key: string]: any
}

const registry: Extensions = ((): Extensions => {
  if (!process.env.EXTENSION_DATA) {
    return {};
  }

  const extensions: Extensions = typeof process.env.EXTENSION_DATA === "string" ?
    JSON.parse(process.env.EXTENSION_DATA) : process.env.EXTENSION_DATA;

  /* "@extensions" is a webpack alias resolving to the customisation directory.
  We use require.context (rather than a plain dynamic require) so we can
  constrain the generated context module to JS/TS files. This stops webpack
  from eagerly bundling non-code files in the extensions directory (e.g.
  README.md), which would otherwise error as they have no matching loader. */
  const extensionsContext = require.context("@extensions", true, /\.(jsx?|tsx?)$/);

  Object.keys(extensions).forEach((key: string) => {
    if (key.endsWith("Component")) {
      const relPath = extensions[key].replace(/^\.\//, "");
      extensions[key] = extensionsContext(`./${relPath}`).default;
    }
  });

  return extensions;
})();


export const getExtension = (what: string): any | false => {
  if (registry[what]) {
    return registry[what];
  }
  console.error("Requested non-existing extension", what);
  return false;
};

export const hasExtension = (what: string): boolean => {
  return Object.keys(registry).includes(what);
};
