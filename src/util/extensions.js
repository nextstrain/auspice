
const registry = (() => {
  if (!webpackConfig.EXTENSION_DATA) {
    // console.log("no EXTENSION_DATA found");
    return {};
  }

  const extensions = typeof webpackConfig.EXTENSION_DATA === "string" ?
    JSON.parse(webpackConfig.EXTENSION_DATA) : webpackConfig.EXTENSION_DATA;

  Object.keys(extensions).forEach((key) => {
    if (key.endsWith("Component")) {
      // console.log("loading component", key);
      /* "@extensions" is a webpack alias */
      extensions[key] = require(`@extensions/${extensions[key]}`).default; // eslint-disable-line
    }
  });
  // console.log("extensions", extensions);

  return extensions;
})();


export const getExtension = (what) => {
  if (registry[what]) {
    return registry[what];
  }
  console.error("Requested non-existing extension", what);
  return false;
};

export const hasExtension = (what) => {
  return Object.keys(registry).includes(what);
};
