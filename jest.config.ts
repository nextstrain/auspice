import type { Config } from 'jest';

const config: Config = {
  transformIgnorePatterns: [
    "node_modules/(?!(d3-.*)/)",
  ],
};

export default config;
