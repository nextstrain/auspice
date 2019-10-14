[![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=master)](https://travis-ci.com/nextstrain/auspice)
[![NPM version](https://img.shields.io/npm/v/auspice.svg?style=flat)](https://www.npmjs.com/package/auspice)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)


> TODO. Release a "version1" tagged auspice before v2 is merged into master & released.
This has not yet been done to remove the possibility of newly released v1 versions from the master branch potentially conflicting with v1 versions released from this branch.

# Auspice version 1 branch notes

This branch represents version 1 of auspice -- please see [the master branch](https://github.com/nextstrain/auspice/) for the latest version of auspice.
Auspice version 1 is still available via:

**Installing from npm**
```bash
npm install --global auspice@version1
```

**Installing from source**
```bash
git clone git@github.com:nextstrain/auspice.git
cd auspice
git checkout version1 # checkout the version 1 branch
npm install # install dependencies
npm install --global . # install "auspice" globally from the current source code
```

## Development of auspice v1

In general, there is no development of auspice version 1 & we encourage people to upgrade.
Important bug fixes can be added to this branch and deployed to npm via
1. Bump the version number manually -- both in `package.json` and `src/version.js`.
This is needed as you cannot publish a package to npm with the same version number as one previously published.
2. Publish to npm with the "version1" tag:
```
npm publish --tag version1
```


# Introduction

Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data.
We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread.
Our goal is to aid epidemiological understanding and improve outbreak response.

Resulting data and inferences are available live at the website [nextstrain.org](https://nextstrain.org).
Documentation is available at [nextstrain.org/docs](https://nextstrain.org/docs).

# Auspice

*Definition: Observation by an augur, ie a prophetic sign.*

Auspice is an open-source interactive web app for visualizing phylogenomic data.
It may be used in tandem with [augur](https://github.com/nextstrain/augur) or on its own.
It may be used to look at phylogenetic trees on your own computer or may be used as a server to share results broadly. 

**Please see [nextstrain.github.io/auspice](https://nextstrain.github.io/auspice) for auspice documentation.**

## Installation

```bash
npm install -g auspice
```
See [here](https://nextstrain.github.io/auspice/installation) for more details.

## Running Auspice

`auspice view` starts the server, which makes local datasets available in a browser at  [localhost:4000/local](http://localhost:4000/local).

By default, the datasets are sourced from the current working directory (or an **auspice** subfolder if it exists).
Please run `auspice view -h` to see how to change this directory, as well as the directory where narratives are sourced from.


## License and copyright
Copyright 2014-2019 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
