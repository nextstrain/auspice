---
title: Install Auspice
---

## Prerequisites 
Auspice is a JavaScript program, and requires [nodejs](https://nodejs.org/) to be installed on your system.

We highly recommend using [conda](https://conda.io/docs/) to manage environments -- for instance to create an environment with nodejs installed
It's possible to use other methods, but this documentation presupposes that you have conda installed.

## Create a conda environment
```bash
conda create --name auspice nodejs=10
source activate auspice
```

> This parallels [the nextstrain.org docs](https://nextstrain.org/docs/getting-started/local-installation#install-augur--auspice-with-conda-recommended).
You're welcome to use those instead!

## Install auspice from npm


```bash
npm install --global auspice
```
Auspice should now be available as a command-line program -- check by running `auspice --help`.

If you look at the [release notes](releases/changelog.md) you can see the changes that have been made to auspice (see your version of auspice via `auspice --version`).
To upgrade, you can run

```bash
npm update --global auspice
```

## Installing from source


This is useful for debugging, modifying the source code, or using an unpublished feature branch.
We're going to assume that you have used conda to install nodejs as above.

```bash
# activate the correct conda enviornment
conda activate auspice
# grab the GitHub auspice repo
git checkout https://github.com/nextstrain/auspice.git
cd auspice
# install dependencies
npm install
# make `auspice` available globally
npm install --global .
# build auspice
auspice build
# test it works
auspice --version
auspice --help
```

Updating auspice is as easy as pulling the new version from GitHub -- it shouldn't require any `npm` commands.
You will, however, have to re-build auspice whenever the client-related code has changed, via `auspice build`.