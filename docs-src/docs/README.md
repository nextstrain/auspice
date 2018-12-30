---
title: Overview
hide_title: true
---

# Auspice: an open-source interactive tool for visualising phylogenomic data

> These docs are for a devlopment branch which is in flux. They are incomplete and will change frequently.

Auspice is an interactive visualisation platform for phylogenomic and other other datasets related to evolution.
It was originally designed for nextstrain.org, which aims to aims to provide a continually-updated view of publicly available pathogen genome data.
Auspice can be used locally to view datasets, or deployed to server- or serverless-websites.
It allows easy customisation of aesthetics and functionality, and powers the visualisations on [nextstrain.org](https://nextstrain.org).


* [overview of functionality](tutorial/README.md)
* [installation instructions](installation.md)
* [customising your auspice build](customisations/README.md)
* [deploying](deploying.md)
* [data formats](inputs.md).


## Running Auspice Locally

Auspice by itself is a visualisation tool for local datasets.
It runs a local server to deliver the files the the visualisation to [localhost:4000](http://localhost:4000).
After [installing](installation.md), you can access datasets in the current directory by running
```bash
auspice view
```
Please see `auspice view -h` for all available options.



## License and copyright
Copyright © 2014-2018 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
