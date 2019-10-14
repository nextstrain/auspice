---
title: Overview
hide_title: true
---

# Auspice: an open-source interactive tool for visualising phylogenomic data

> I think this page should describe auspice rather than how to run it.

> I agree with ^. Especially as a newbie to the phylogenetics world, I'd really like to know more about the power of auspice: Why should I use it? What is its basic functionality? Even though this is the docs, I think a little bit of marketing would be appropriate. -- Cassia

> Please not that these docs describe the newest version of auspice (versions 1.35+).
The new APIs are in flux and we expect they will change before version 2.0 is released.
If you use these versions of auspice we would love to hear about your experiences! (Contact links at the bottom of the page).

Auspice is an interactive visualisation platform for phylogenomic and other other datasets related to evolution.
It was originally designed for nextstrain.org, which aims to aims to provide a continually-updated view of publicly available pathogen genome data.
Auspice can be used locally to view datasets, or deployed to server- or serverless-websites.
It allows easy customisation of aesthetics and functionality, and powers the visualisations on [nextstrain.org](https://nextstrain.org).

> I think this page could also be a good place to explain how to navigate the rest of the docs. Which section do I want to go to next? Why would I use auspice.us vs. custom server vs. static-site generator vs. narratives? This doesn't have to be long, but I was just confused/overwhlemed about where/why I want to visit the different tabs. --Cassia

## Running Auspice Locally

Auspice by itself is a visualisation tool for local datasets.
It runs a local server to provide a  visualisation in the browser at [localhost:4000](http://localhost:4000).
After [installing](introduction/install.md), you can access datasets in the current directory by running
```bash
auspice view
```
Please see `auspice view --help` for all available options.


## License and copyright
Copyright © 2014-2018 Trevor Bedford and Richard Neher.

Source code to Nextstrain is made available under the terms of the [GNU Affero General Public License](LICENSE.txt) (AGPL). Nextstrain is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
