Master: [![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=master)](https://travis-ci.com/nextstrain/auspice)
Release: [![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=release)](https://travis-ci.com/nextstrain/auspice)
npm: [![NPM version](https://img.shields.io/npm/v/auspice.svg?style=flat-square)](https://www.npmjs.com/package/auspice)


## Introduction

Auspice is an open-source interactive web app for visualising phylogenomic data.
It is the app that powers all the vlisualisation on [nextstrain.org](https://nextstrain.org), which aims to provide a continually-updated view of publicly available pathogen genome data.
Auspice was designed to aid epidemiological understanding and improve outbreak response, but is able to visualise a diverse range of datasets.


Please see [nextstrain.org/docs/visualisation/introduction](https://nextstrain.org/docs/visualisation/introduction) for more information, including input file formats.


## Installation

```
npm install -g auspice
```

Note that this requires node and npm to be installed (see below for instructions).

## Running Auspice

`auspice` starts the server, which makes local datasets available in a browser at  [localhost:4000/local](http://localhost:4000/local).

By default, the datasets are sourced from the current working directory (or an **auspice** subfolder if it exists). Please run `auspice -h` to see how to change this directory, as well as the directory where narratives are sourced from.


## Developing

Development requires installation by cloning the github repo:

```
cd nextstrain # or whichever folder you'd like to contain nextstrain repos in
git clone https://github.com/nextstrain/auspice.git
cd auspice
npm install     # install package dependencies
npm run dev     # start the server (with hot-reloading)
```

Then access the app via [localhost:4000/local](http://localhost:4000/local).
Changes to the (client) code should automatically update the browser.

By default, datasets and narratives are sourced out of the `auspice/data` and `auspice/local_narratives` directories. Running `npm run dev -- -h` shows the available options to change these defaults.

To build the production code (which is what the live site and global npm install use), run `npm run build` to transpile the client code, and `npm run server` to start the server.


## How to install Node.js and npm
If you are comfortable using [conda](https://bioconda.github.io/), installing nodejs is as simple as `conda install -c conda-forge nodejs=9.11.1`.
If you'd prefer not to use conda, `nvm` is an easy way to manage nodejs & npm versions -- [this guide walks you through the installation](https://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/).


## Releasing new versions.
You will need push access to [github.com/nextstrain/auspice](http://github.com/nextstrain/auspice), and local `master` must be up-to-date.
Releasing should then be as simple as running `./releaseNewVersion` and following the prompts.


## Deploying to npm
This should be handled automatically when releases happen (assuming that the TravisCI build passes).
To do this manually:
* ensure your npm account is registered with [npmjs.com/package/auspice](https://www.npmjs.com/package/auspice)
* build the `bundle.js` via `npm run build`
* ensure the version number (`node server.js --version`) is different to [npmjs.com/package/auspice](https://www.npmjs.com/package/auspice)
* `npm publish`


## License and copyright
Copyright 2014-2018 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
