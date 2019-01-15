---
title: Installing auspice
---

Auspice is written in Javascript and will require nodejs and npm (the node package manager) to install.
If you are comfortable using [conda](https://conda.io/docs/) these may be easily installed in your environment ([see here](https://anaconda.org/conda-forge/nodejs)).
If you are on Linux or MacOS, you could also use nvm to insall these ([see here](https://nodesource.com/blog/installing-node-js-tutorial-using-nvm-on-mac-os-x-and-ubuntu/)).


## Global NPM install
Auspice is avaliable as a [npm package](https://www.npmjs.com/package/auspice) and can be installed simply via:
```bash
npm install --global auspice
```
Auspice is now available as a command-line program -- check by running `auspice -h`.
Documentation for how to run auspice locally is [available here](overview.md#running-auspice-locally).


## Installing as a project's dependency
If you are building a customised version of auspice, you may want to include it as a dependency of that project.
This allows you to pin the version, use continuous integration tooling and simplifies any code imports you may wish to use.
```bash
npm install --save auspice
```
> Note that `auspice` is not available as a command line tool this way, but can be accessed from within the repo via `npx auspice`.
See [customising auspice](customisations/introduction.md) for more information.

## Installing from source
```bash
git clone git@github.com:nextstrain/auspice.git
cd auspice
npm install # install dependencies
npm install -g . # make "auspice" available globally
```

Note that (at least on MacOS) this symlinks the source directory into the global `node_modules` folder so that changes to source code are automatically reflected in the globally available `auspice` command.
We have had good success using a conda environment for development.


## Developing

Install auspice from source (see above).
Running auspice in development mode will automatically update as you change the source code:
```bash
auspice develop --verbose
```
(See `auspice develop -h` for further options)


## Building auspice
Install auspice from source (see above).

```bash
auspice build --verbose
```
(See `auspice build -h` for further options)

## Running auspice
See [running locally documentation](overview.md#running-auspice-locally).


