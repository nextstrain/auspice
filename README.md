Master: [![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=master)](https://travis-ci.com/nextstrain/auspice)
Release: [![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=release)](https://travis-ci.com/nextstrain/auspice)

## Introduction

Auspice is an open-source interactive web app for visualising phylogenomic data.
It is the app that powers all the vlisualisation on [nextstrain.org](https://nextstrain.org), which aims to provide a continually-updated view of publicly available pathogen genome data.
Auspice was designed to aid epidemiological understanding and improve outbreak response, but is able to visualise a diverse range of datasets.


Please see [nextstrain.org/docs/visualisation/introduction](https://nextstrain.org/docs/visualisation/introduction) for more information, including input file formats.


## Local Installs via NPM

```
npm install -g auspice
```

Then run the server via the `auspice` command and access local datasets in a web browser at [localhost:4000/local](http://localhost:4000/local).

The source for the input JSONs defaults to the `<current_working_directory>/auspice` (or `<current_working_directory>` if that's not available).


## Local Installs via GitHub

```
cd nextstrain # or whichever folder you'd like to contain nextstrain repos in
git clone https://github.com/nextstrain/auspice.git
cd auspice
npm install     # install package dependencies
npm run build   # build the client javascript bundle
npm run server  # start a local instance of the server
```

Then access the app via [localhost:4000/local](http://localhost:4000/local).

By default, datasets and narratives are sourced out of the `auspice/data` and `auspice/local_narratives` directories (see below for how to change this).

If you are modifying the code, running `npm run dev` (instead of `npm run build` and `npm run server`) will modify the bundle on-the-fly, allowing you to see changes without rebuilding. Note that changes to the server code require restarting the server to take effect.

## Selecting the local datasets / narratives directory:
The commands `auspice`, `npm run server` and `npm run dev` accept the following arguments:
* `data:<path>` sets the source of local datasets, viewable via [localhost:4000/local](http://localhost:4000/local)
* `narratives:<path>` sets the source of local narratives, viewable via [localhost:4000/local/narratives](http://localhost:4000/local/narratives)

## How to install Node.js and npm

If you are comfortable using [conda](https://bioconda.github.io/), installing nodejs is as simple as `conda install -c conda-forge nodejs=9.11.1`.
If you'd prefer not to use conda, `nvm` is an easy way to manage nodejs & npm versions -- [this guide walks you through the installation](https://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/).

## License and copyright

Copyright 2014-2018 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
