---
title: Customising auspice
---

> This page needs to convey how important and powerful this functionality is.

Auspice (the client) allows one to customise the visual appearence.
This is how auspice.us and nextstrain.org/zika look different, despite both being built using auspice.

We do this by defining a set of customisations -- both functional and aesthetic -- which are overlaid during the compilation phase. 


The available customisations are accessed through a `<clientConfig>` JSON which is used via `auspice develop --extend <json>` or `auspice build --extend <json>`. This properties allowed in this json include:

* `splashComponent`
* `navbarComponent`
* `browserTitle` -- the page title (i.e. the name in the tab of the browser window)
* `sidebarTheme`
* `entryPage`
* `hardcodedDataPaths`



See the [API docs](customise-client/api.md) for full details of each customisation, or read the [walk through](customise-client/walk-through.md) to see how we used these to create a custom version of auspice.


