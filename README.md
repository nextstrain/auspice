## Introduction

Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data. We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread. Our goal is to aid epidemiological understanding and improve outbreak response.

Resulting data and inferences are available live at the website [nextstrain.org](https://nextstrain.org). Documentation is available at [nextstrain.org/docs](https://nextstrain.org/docs).

## Auspice

*Definition: Observation by an augur, ie a prophetic sign.*

Auspice is the web app that gives an interactive visualization of inferences produced by augur pipeline.

## Install

To install auspice, clone the git repository

```
cd nextstrain/
git clone https://github.com/nextstrain/auspice.git
cd auspice
```

You'll need Node.js to run auspice. You can check if node is installed with `node --version`. With Node.js present you can install auspice with

```
npm install
```

You can then run auspice locally by running `npm start` and opening a browser to [http://localhost:4000](http://localhost:4000/).


## Build Electron App

_Needs debugging._

```
npm install -g electron-builder
npm run dist:electron
```

## License and copyright

Copyright 2014-2018 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
