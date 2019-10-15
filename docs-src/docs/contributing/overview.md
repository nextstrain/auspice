---
title: Contributing
---


Auspice is developed via GitHub and issues and comments are very welcome.
Alternatively, [email us](mailto:hello@nextstrain.org) with any questions or comments you may have. 


## Contributing to these docs

This documentation is all contained within the auspice GitHub repo -- see [the docs-src directory](https://github.com/nextstrain/auspice/tree/master/docs-src) for more details and instructions on how to contribute here.

## Contributing to devlopment
If you are interested in contrubuting code then it'd be best to create a [GitHub issue](https://github.com/nextstrain/auspice/issues) before spending time in the codebase!
For pull requests, please use [eslint](https://eslint.org/) as much as possible -- thanks! 



## Releasing new version of auspice

New versions are released via the `./releaseNewVersion.sh` script from an up-to-date `master` branch.

It will prompt you for the version number increase, push changes to the `release` branch and, as long as Travis-CI is successful then a new version will be automatically published to [npm](https://www.npmjs.com/package/auspice).

