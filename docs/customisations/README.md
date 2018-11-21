---
title: Extending Auspice
---


Auspice may be build with a number of "extensions" which change it's behaviour and appearence.
These pages detail the purpose, scope and details of these extensions.
It is through extensions that auspice is customised to run [nextstrain.org](https://nextstrain.org).


## Using auspice to access local datasets.
By default (i.e. without any extensions) auspice only accesses local datasets.
`auspice view -h` lists the available options for viewing local datasets.
For instance, running
```
auspice view --verbose --datasetDir .
```
Will start a server sourcing dataset JSONs from the current working directory, which will be available to view at [localhost:4000](http://localhost:4000).


## Developing and building auspice without extensions.
From the auspice source direcory:

```bash
# DEVELOPMENT
node auspice.js develop --verbose

# PRODUCTION
node auspice.js build --verbose # or auspice build --verbose
node auspice.js view --verbose # or auspice view --verbose

# DEPLOY TO NPM
# to do
```

The provided server (`node auspice.js view` or `auspice view`) could be used as a production server, perhaps with custom handlers provided (see [these docs](charonAPI.md)).


## Developing and building auspice with extensions.
Auspice has two forms of extensions:

### Client extensions
These may provide [custom components](componentInterfaces.md), [visual themes](sidebarTheme.md) and other settings.
They are defined in a `<clientConfig>` JSON file which defines an object with some or all of the following properties:
* "splashComponent" -- see [custom components](componentInterfaces.md)
* "navbarComponent" -- see [custom components](componentInterfaces.md)
* "browserTitle" -- the page title (i.e. the name in the tab of the browser window)
* "sidebarTheme" -- see [visual themes](sidebarTheme.md)
* "entryPage" -- not yet documented
* "hardcodedDataPaths" -- not yet documented, see [these docs](charonAPI.md).

### Server extensions
See [these docs](charonAPI.md) for how to define the `<serverHandlers>` javascript file.

### Developing & Building custom auspice versions
While it's possible to run these commands from the auspice source directory (using `node auspice.js ...`), it's preferable to run them from the repo containing the client / server customisations.
This requires `auspice` to be installed globally (see above).

```bash
## DEVELOPMENT
node auspice.js develop --verbose --extend <clientConfig> --handlers <serverHandlers>
## BUILD
node auspice.js build --verbose --extend <clientConfig>
## VIEW (using auspice server with custom handlers)
node auspice.js view --verbose --handlers <serverHandlers> --customBuild
```


## Examples of customisations:

* Auspice.us -- [documentation](../auspice.us/README.md)
* Nextstrain -- [documentation](https://github.com/nextstrain/nextstrain.org/tree/whitelabel)
* ZEBOV (serverless) -- [documentation](https://github.com/blab/ZEBOV)
* Simulated viral outbreak for a ARTIC workshop in Ghana -- [here](https://artic-network.github.io/artic-workshop)
