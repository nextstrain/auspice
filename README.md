## Introduction

The nextstrain project is an attempt to make flexible informatic pipelines and visualization tools to track ongoing pathogen evolution as sequence data emerges. The nextstrain project derives from [nextflu](https://github.com/blab/nextflu), which was specific to influenza evolution.

nextstrain is comprised of three components:

* [fauna](https://github.com/nextstrain/fauna): database and IO scripts for sequence and serological data
* [augur](https://github.com/nextstrain/augur): informatic pipelines to conduct inferences from raw data
* [auspice](https://github.com/nextstrain/auspice): web app to visualize resulting inferences

## Development

The current auspice repo is still very much a work-in-progress. We recommend that you use [nextflu](https://github.com/blab/nextflu) instead for current applications. At some point, this repo will takeover from the nextflu repo.

## Auspice

*Definition: Observation by an augur, ie a prophetic sign.*

Auspice is the web app that gives an interactive display of inferences produced by augur pipeline.

## Getting started

`$ git clone ... `
`$ cd ... `
`$ npm install `
`$ npm start `

# Package for Electron
```
npm install
npm build
npm install electron-packager -g
npm install -g electron-packager-interactive
electron-packager-interactive
```

## License and copyright

Copyright 2014-2016 Trevor Bedford, Richard Neher and Colin Megill.

Source code to nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
