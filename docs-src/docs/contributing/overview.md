---
title: Contributing to Auspice
---


Auspice is developed via GitHub and issues and comments are very welcome -- [click here](https://github.com/nextstrain/auspice/issues/new) to create a new issue.
Alternatively, you can [email us](mailto:hello@nextstrain.org) with any questions or comments you may have.


## Contributing to Documentation

This documentation is all contained within the Auspice GitHub repo -- see [the README](https://github.com/nextstrain/auspice/tree/master/docs-src) within the `docs-src` directory for more details and instructions on how to contribute.


## Contributing to Development

We're very happy to have outside contributions to Auspice and see it grow.
If you are interested in contrubuting code then we would recommend that you create a [GitHub issue](https://github.com/nextstrain/auspice/issues/new) before spending time in the codebase.
For pull requests, please use [eslint](https://eslint.org/) as much as possible -- thanks!



## Releasing New Versions of Auspice

New versions are released via the `./releaseNewVersion.sh` script from an up-to-date `master` branch.

It will prompt you for the version number increase, push changes to the `release` branch and, as long as Travis-CI is successful, then a new version will be automatically published to [npm](https://www.npmjs.com/package/auspice).
> Note that for this to work, you will need to have push access to the [auspice](https://github.com/nextstrain/auspice/) repository.

