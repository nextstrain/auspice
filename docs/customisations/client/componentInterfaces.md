---
title: Injecting custom components
---

Currently you can extend auspice by replacing react components with custom components.
These custom components will receive props defined here, which can be used to update the rendering of the component using the normal react lifecycle methods.
Right now this is only available for the splash page and nav-bar components, whose interfaces are defined here.

Each component must be the default export of a javascript file which is specified in the (client) config JSON passed to auspice at build time (`auspice build` or `auspice develop`).

> These interfaces are very experimental and will change frequently. Documentation is somewhat incomplete ;)

## Splash component

Props:
* `isMobile` boolean
* `available` available datasets and narratives
* `browserDimensions` broswer width & height
* `dispatch` callback
* `errorMessage` callback
* `changePage` callback

Build config:
```json
{
  "splashComponent": "<javascript file>"
}
```


## Nav-bar component

Props:
* `narrativeTitle` string
* `sidebar` boolean. Is it to be displayed in the sidebar?

The navbar also receives the (possibly customised) sidebar theme which can be used to style components.

Build config:
```json
{
  "navbarComponent": "<javascript file>"
}
```
