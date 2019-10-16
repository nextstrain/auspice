---
title: Contributing
---


Auspice is developed via GitHub and issues and comments are very welcome.
Alternatively, you can [email us](mailto:hello@nextstrain.org) with any questions or comments you may have.


## Contributing to tbe Docs

This documentation is all contained within the Auspice GitHub repo -- see [the docs-src directory](https://github.com/nextstrain/auspice/tree/master/docs-src) for more details and instructions on how to contribute.

## Contributing to Devlopment
If you are interested in contrubuting code then we would recommend that you create a [GitHub issue](https://github.com/nextstrain/auspice/issues) before spending time in the codebase.
For pull requests, please use [eslint](https://eslint.org/) as much as possible -- thanks!



## Releasing New Versions of Auspice

New versions are released via the `./releaseNewVersion.sh` script from an up-to-date `master` branch.

It will prompt you for the version number increase, push changes to the `release` branch and, as long as Travis-CI is successful, then a new version will be automatically published to [npm](https://www.npmjs.com/package/auspice).

