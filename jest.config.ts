import type { Config } from 'jest';

const config: Config = {
  transformIgnorePatterns: [
    "node_modules/(?!(d3-.*)/)",
  ],
  moduleNameMapper: {
    // redirect CSS imports to the style stub
    "\\.css$": "<rootDir>/test/fixtures/styleStub.js",
  },
};

export default config;
