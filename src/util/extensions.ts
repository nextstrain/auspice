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

  Object.keys(extensions).forEach((key: string) => {
    if (key.endsWith("Component")) {
      /* "@extensions" is a webpack alias */
      extensions[key] = require(`@extensions/${extensions[key]}`).default;
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
