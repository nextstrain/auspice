# Development docs

## Getting started

Thank you for helping us to improve Nextstrain!

##### [To get started, please see the contributing guide for useful information about how to pick an issue, submit your contributions, and so on.](https://github.com/nextstrain/.github/blob/master/CONTRIBUTING.md)

This project strictly adheres to the [Contributor Covenant Code of Conduct](https://github.com/nextstrain/.github/blob/master/CODE_OF_CONDUCT.md).

Please see the [project board](https://github.com/orgs/nextstrain/projects/5) for currently available issues.

## Contributing code  
[Please see the main auspice docs](https://nextstrain.github.io/auspice/introduction/install) for details on how to install and run auspice locally.

For pull requests, please use [eslint](https://eslint.org/) as much as possible -- thanks!

## Contributing to Documentation

This documentation is all contained within the Auspice GitHub repo -- see [the README](https://github.com/nextstrain/auspice/tree/master/docs-src) within the `docs-src` directory for more details and instructions on how to contribute.

Please see [docs-src/README](./docs-src/README.md) for how the auspice documentation site is built.

Note that currently the documentation must be rebuilt & pushed to GitHub _after_ a new version is released in order for the changelog to correctly appear at [nextstrain.github.io/auspice/releases/changelog](https://nextstrain.github.io/auspice/releases/changelog).


## Releases & versioning
New versions are released via the `./releaseNewVersion.sh` script from an up-to-date `master` branch. It will prompt you for the version number increase, push changes to the `release` branch and, as long as Travis-CI is successful then a new version will be automatically published to [npm](https://www.npmjs.com/package/auspice).
