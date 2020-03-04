[![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=master)](https://travis-ci.com/nextstrain/auspice)
[![NPM version](https://img.shields.io/npm/v/auspice.svg?style=flat)](https://www.npmjs.com/package/auspice)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)


Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data.
We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread.
Our goal is to aid epidemiological understanding and improve outbreak response.

Resulting data and inferences are available live at the website [nextstrain.org](https://nextstrain.org).

> We have recieved a number of generous offers to contribute developer effort to nextstrain (and auspice) folowing our work on [SARS-CoV-2](https://nextstrain.org/ncov).
We are flattered and would welcome contributions!
Please see the [contributing](./CONTRIBUTING.md) documentation for more details.
A list of potential issues is being actively maintained at https://github.com/orgs/nextstrain/projects/5

# Auspice

*Definition: Observation by an augur, ie a prophetic sign.*

Auspice is an open-source interactive web app for visualizing phylogenomic data.
It may be used in tandem with nextstrain's bioinformatics toolkit [augur](https://github.com/nextstrain/augur) or on its own.
Auspice may be used to explore datasets locally or run as a as a server to share results. 

## Documentation

**Please see [nextstrain.github.io/auspice](https://nextstrain.github.io/auspice) for auspice documentation.**


## Installation

```bash
npm install --global auspice
```

See [here](https://nextstrain.github.io/auspice/introduction/install) for full instructions, including how to install from source.


## Quickstart

In order to get up & running you'll need to have some datasets to visualise.
Please see the [nextstrain docs](https://nextstrain.org/docs/) for tutorials on how to do this.
For the purposes of getting started, you can download the current zika dataset via:

```
mkdir datasets
curl http://data.nextstrain.org/zika.json --compressed -o datasets/zika.json
```

And then run `auspice` via:
```
auspice view --datasetDir datasets
```
This will allow you to run auspice locally (i.e. from your computer) and view the dataset which is behind [nextstrain.org/zika](https://nextstrain.org/zika).


Run `auspice --help` or visit [nextstrain.github.io/auspice](https://nextstrain.github.io/auspice) for more information.

## Development, comments, issues and bugs

Auspice is developed via GitHub and issues are very welcome. Alternatively, [email us](mailto:hello@nextstrain.org) with any questions or comments you may have. 
If you are interested in submitting a pull request please use [eslint](https://eslint.org/) as much as possible -- thanks! 

New versions are released via the `./releaseNewVersion.sh` script from an up-to-date `master` branch. It will prompt you for the version number increase, push changes to the `release` branch and, as long as Travis-CI is successful then a new version will be automatically published to [npm](https://www.npmjs.com/package/auspice).

Please see [docs-src/README](./docs-src/README.md) for how the auspice documentation site is built.

> Note that currently the documentation must be rebuilt & pushed to GitHub _after_ a new version is released in order for the changelog to correctly appear at [nextstrain.github.io/auspice/releases/changelog](https://nextstrain.github.io/auspice/releases/changelog).


## License and copyright
Copyright 2014-2019 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
