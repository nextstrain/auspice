const path = require("path");

module.exports = function babelConfig(api) {
  const presets = [
    "@babel/env",
    "@babel/preset-react"
  ];
  const plugins = [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-class-properties"
  ];
  if (api.env("development")) {
    if (process.env.EXTENSION_PATH && !path.resolve(process.env.EXTENSION_PATH).includes(__dirname)) {
      console.log("Not using react-hot-loader/babel plugin with auspice extensions as this produces an error. TO FIX.");
      /* with extensions from a dir not within the main auspice directory we get the error:
       * Module not found: Error: Can't resolve 'react-hot-loader' in ...extension directory...
       * Which I can't fix. Tried:
       * require.resolve("react-hot-loader/babel")
       * setting babelrcRoots
       * but google seems to have failed me.
       * It may be a bug with "react-hot-loader/babel" as the other plugins work just fine!
       */
    } else {
      plugins.push("react-hot-loader/babel");
    }
  }
  if (!api.env("timing")) {
    plugins.push(["strip-function-call", {strip: ["timerStart", "timerEnd"]}]);
  }
  api.cache(true);
  return {
    presets,
    plugins
  };
};
