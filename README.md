[![Build Status](https://travis-ci.com/nextstrain/auspice.svg?branch=master)](https://travis-ci.com/nextstrain/auspice)
[![NPM version](https://img.shields.io/npm/v/auspice.svg?style=flat)](https://www.npmjs.com/package/auspice)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![BrowserStack](src/images/Browserstack-logo.svg)](https://www.browserstack.com)

## Introduction

Auspice is an open-source interactive web app for visualising phylogenomic data.
It is the app that powers all the visualisation on [nextstrain.org](https://nextstrain.org), which aims to provide a continually-updated view of publicly available pathogen genome data.
Auspice was designed to aid epidemiological understanding and improve outbreak response, but is able to visualise a diverse range of datasets.


**Please see [nextstrain.github.io/auspice](https://nextstrain.github.io/auspice) for further details.**


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
