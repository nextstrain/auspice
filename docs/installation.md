---
title: Installing auspice
---


Auspice is written in Javascript and will require nodejs and npm (the node package manager) to install.
If you are comfortable using [conda](https://conda.io/docs/) these may be easily installed in your environment ([see here](https://anaconda.org/conda-forge/nodejs)).
If you are on Linux or MacOS, you could also use nvm to insall these ([see here](https://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/)).


## Local install

To build custom versions of auspice (i.e. extensions), you'll need auspice to be installed globally on your computer.
In the future this will be done via `npm install --global auspice` however during development you must install it from source:
```bash
cd auspice
npm install -g .
```
Note that (at least on MacOS) this symlinks the source directory into the global `node_modules` folder so that changes to source code are automatically reflected in the globally available `auspice` command. I do all of this in a conda environment and would recommend doing the same.


> for when this is published on npm:
Auspice is avaliable as a [npm package](https://www.npmjs.com/package/auspice) and can be installed simply via:
```bash
npm install --global auspice
```
Auspice is now available as a command-line program -- check by running `auspice -h`.
Documentation for how to run auspice locally is [available here](runningLocally.md).


## Installing as a project's dependency
If you are building a customised version of auspice, you may want to include it as a dependency of that project.
This allows you to pin the version, use continuous integration tooling and simplifies any code imports you may wish to use.
```bash
npm install --save auspice
```
Note that `auspice` is not available as a command line tool this way, but can be accessed from within the repo via `npx auspice`.
See [customising auspice](customisations/README.md) for more information.


## Developing

Clone the auspice source code & install dependencies:
```bash
git clone https://github.com/nextstrain/auspice
cd auspice
npm install
npm install --global .
```

Auspice is notw available as a command line program `auspice` (which is simply running `node auspice.js`).
Note that (at least on MacOS) this symlinks the source directory into the global `node_modules` folder so that changes to source code are automatically reflected in the globally available `auspice` command.

You can then run the same commands as in the [running locally documentation](runningLocally.md).
