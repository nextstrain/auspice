Master: [![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=master)](https://travis-ci.com/nextstrain/auspice)
Release: [![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=release)](https://travis-ci.com/nextstrain/auspice)

## Introduction

Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data. We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread. Our goal is to aid epidemiological understanding and improve outbreak response. See [nextstrain.org/docs](https://nextstrain.org/docs) for more details.


Auspice is the code which powers all the nextstrain data viz -- e.g. [nextstrain.org/zika](https://nextstrain.org/zika).
It is a javascript-based web app that gives an interactive visualization of genomic data (which is normally, but not necessarily, produced by [augur](https://github.com/nextstrain/augur)).


## Local Installs

#### Step 1: clone the git repository

```
cd nextstrain # or whichever folder you'd like to contain nextstrain repos in
git clone https://github.com/nextstrain/auspice.git
cd auspice
```

#### Step 2: Install Node.js

If you are comfortable using conda, installing nodejs is as simple as `conda install -c conda-forge nodejs=9.11.1`. If you'd prefer not to use conda, I recommend using `nvm` in order to manage nodejs & npm versions -- [here's](https://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/) a great guide to help you do this.


#### Step 3: Install required dependencies

`npm install`

#### Step 4: Create / obtain data files (if you'd like to view local datasets)

Auspice can either source data from your computer or from a server.
If you'd like to view data files locally, the JSON(s) need to be present in the `data` directory (see [the docs](https://nextstrain.org/docs/bioinformatics/output-jsons) for the format of these).
If you have local data files (e.g. produced via [augur](https://github.com/nextstrain/augur)) then copy them into this directory.
If you'd like to download the latest JSONs which we are using for [nextstrain.org](nextstrain.org) then run `npm run get-data` which will download JSONs into `data`

#### Step 5: Build auspice & server the server

* Simplest: `npm run build && npm run server:local`.
This builds the relevant bundles & starts the server accessing the datasets in `./data`.

* To access datasets online (e.g. to mimic the live nextstrain site), instead run `npm run build && npm run server`.

* In order to run the development server, which allows you to edit the source code on-the-fly, run `npm run dev` or `npm run dev:local` (the latter sources data from `./data`)


#### Step 6: Open a browser
Auspice can now be used via `localhost:4000`.
If you have JSONS in `data` named `flu_europe_tree.json` & `flu_europe_meta.json`, then these can be viewed at `localhost:4000/flu/europe`.


## License and copyright

Copyright 2014-2018 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
