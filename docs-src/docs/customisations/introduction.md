---
title: Extending Auspice
---

It's possible to "extend" auspice and change the aesthetics and/or functionality.
This allows custom builds of auspice each with their own appearence.
[nextstrain.org](https://nextstrain.org) is one such custom build.


## Developing and building auspice with extensions.
Auspice has two forms of extensions:


### Client extensions
Customising the appearence and functionality of the client is achieved through code injection at build time.
The available customisations are accessed through a `<clientConfig>` JSON with the following properties:

* "splashComponent" -- see [custom components](client/componentInterfaces.md)
* "navbarComponent" -- see [custom components](client/componentInterfaces.md)
* "browserTitle" -- the page title (i.e. the name in the tab of the browser window)
* "sidebarTheme" -- see [visual themes](client/sidebarTheme.md)
* "entryPage" -- not yet documented
* "hardcodedDataPaths" -- not yet documented, see [these docs](server/charonAPI.md).


### Server extensions
The client makes a number of requests which can be dynamically handled.
Alternativly, the files can defined at build time such that no server is needed.
See [these docs](server/charonAPI.md) for how to define the `<serverHandlers>` javascript file.


### Developing & Building custom auspice versions
While it's possible to run these commands from the auspice source directory (using `node auspice.js ...`), it's preferable to run them from the repo containing the client / server customisations.
This requires `auspice` to be installed globally (see above).

```bash
## DEVELOPMENT
auspice develop --verbose --extend <clientConfig> --handlers <serverHandlers>
## BUILD
auspice build --verbose --extend <clientConfig>
## VIEW (using auspice server with custom handlers)
auspice view --verbose --handlers <serverHandlers> --customBuild
```


## Examples of customisations:

* Auspice.us -- _to do_
* Nextstrain -- [documentation](https://github.com/nextstrain/nextstrain.org/tree/whitelabel)
* ZEBOV (serverless) -- [documentation](https://github.com/blab/ZEBOV)
* Simulated viral outbreak for a ARTIC workshop in Ghana -- [here](https://artic-network.github.io/artic-workshop)
