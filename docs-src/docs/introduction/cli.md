---
title: Auspice Commands
---

> This page meant to explain the CLI commands and provide links the appropriate docs for them


## `view`

`auspice view`
* `--datasetDir`
* `--narrativeDir`
* `--verbose`
* `--handlers` -- see section in customising the server docs
* `--customBuild`


## `build`

Building should only be necessary for [applying customisations](customise-client/introduction.md) or for [generating static sites](build-static/introduction.md).


`auspice build`
* `--datasetDir`
* `--extend` see [applying customisations](customise-client/introduction.md)
* `--verbose`
* `--includeTiming` dev only
* `--serverless` will probably be renamed `--static`. Point to [generating static sites](build-static/introduction.md)
* `--analyzeBundle` dev only


## `develop`

This is only needed if you have installed from source and are modifying the code.
It is not needed for server or client customisations.


`auspice develop`
* `--datasetDir` see above
* `--narrativeDir` see above
* `--extend` see above
* `--verbose` see above
* `--includeTiming` see above
* `--handlers` see above
* `--gh-pages` see above, will probably change soon


## `convert`





