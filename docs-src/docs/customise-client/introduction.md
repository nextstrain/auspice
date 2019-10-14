---
title: Customising auspice
---

> This page needs to convey how important and powerful this functionality is.

> I think examples of what customization options are available is very important. This may be what ends up being available in the "Creating a custom instance" section. Also, as a computing noob, I don't know what API is. Your audience reading this might as they're probs more technically advanced than I, but just an FYI. -Cassia

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



See the [API docs](customise-client/api.md) for full details of each customisation.


