---
title: Installing & Running Locally
---

## Prerequisites 
Auspice is a JavaScript program, and requires [nodejs](https://nodejs.org/) to be installed on your system.

You can either install from the [nodejs website](https://nodejs.org/en/) or use [conda](https://conda.io/docs/), which is extremely popular in the bioinformatics community, to create a nodejs environment:
```bash
conda create --name auspice nodejs
source activate auspice
```
which has the advantage of creating an isolated environment. 

## Installing

```bash
npm install --global auspice
```
Auspice should now be available as a command-line program -- check by running `auspice --version` or `auspice --help`.

> Currently [this bug](https://github.com/nextstrain/auspice/issues/689) causes issues if auspice is not installed globally, so please use the `--global` flag.

Auspice may also be installed from source, but this shouldn't be necessary unless you would like to contribute to the source code 🙌. Note that auspice can be customised without needing to modify the source code -- see [customising the client](customise-client/introduction.md). See the [GitHub repo](https://github.com/nextstrain/auspice) for how to install from source.


## Running locally

> TODO: provide a script to get some datasets (from nextstrain's S3 bucket?) so that local installations can get up and running even if they don't have data. 

If you have [auspice compatable JSONs](introduction/data-formats.md) then auspice can visualise these by running

```bash
auspice view --datasetDir <dir>
```

where `<dir>` contains the JSONs. This command makes the data available to view in a browser at [localhost:4000](http://localhost:4000).



