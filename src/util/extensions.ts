// TODO: Add typing for individual extensions.
// See docs/customise-client/api.rst.
type Extensions = {
  [key: string]: any
}

const registry = (() => {
  if (!process.env.EXTENSION_DATA) {
    // console.log("no EXTENSION_DATA found");
    return {};
  }

  const extensions: Extensions = typeof process.env.EXTENSION_DATA === "string" ?
    JSON.parse(process.env.EXTENSION_DATA) : process.env.EXTENSION_DATA;

  Object.keys(extensions).forEach((key: string) => {
    if (key.endsWith("Component")) {
      // console.log("loading component", key);
      /* "@extensions" is a webpack alias */
      extensions[key] = require(`@extensions/${extensions[key]}`).default;
    }
  });
  // console.log("extensions", extensions);

  return extensions;
})();


export const getExtension = (what: string) => {
  if (registry[what]) {
    return registry[what];
  }
  console.error("Requested non-existing extension", what);
  return false;
};

export const hasExtension = (what: string) => {
  return Object.keys(registry).includes(what);
};
