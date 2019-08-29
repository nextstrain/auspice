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
> These instructions (and more!) also live at [the Nextstrain docs](https://nextstrain.org/docs/getting-started/local-installation#install-auspice-from-source)
```bash
git clone git@github.com:nextstrain/auspice.git
cd auspice
npm install # install dependencies
npm install -g . # make "auspice" available globally
```

Note that (at least on MacOS) this symlinks the source directory into the global `node_modules` folder so that changes to source code are automatically reflected in the globally available `auspice` command.

To separate the npm-distributed and your development version of auspice, we recommend running Auspice inside of a virtual environment such as [Conda](https://conda.io/en/latest/).
If you have Conda installed, you can set up a Conda environment named "`auspice`" with the correct version of Node by running:

    conda create -n auspice nodejs=10
    conda activate auspice

Once you're inside of your newly created Conda environment, run the code from above (starting with `git clone...` through `npm install -g .`) Now, when you run `which auspice`, you should see that your Auspice path is within your newly created Conda environment.


## Developing

Install auspice from source (see above).
Running auspice in development mode will automatically update as you change the source code:
```bash
auspice develop --verbose
```
(See `auspice develop -h` for further options)

Note: when running auspice locally, be mindful of the [server-side code that completes data requests within auspice](/docs-src/docs/customisations/server/charonAPI.md).
The code for external auspice servers to be imported is not yet implemented.

## Building auspice
Install auspice from source (see above).

```bash
auspice build --verbose
```
(See `auspice build -h` for further options)

## Running auspice
See [running locally documentation](overview.md#running-auspice-locally).
