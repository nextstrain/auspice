import type { Config } from 'jest';

const config: Config = {
  transformIgnorePatterns: [
    "node_modules/(?!(d3-.*)/)",
  ],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/test/fixtures/styleStub.js",
  },
};

export default config;
