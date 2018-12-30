---
title: Injecting custom components
---

> These interfaces are very experimental and will change frequently.
Documentation is somewhat incomplete.
Please contact us (links at the bottom of the page) if you are using these customisations as we would like to develop them in a collaborative fashion.


One way to extend auspice is by replacing react components with your own custom components.
These custom components will receive props defined here, which can be used to update the rendering of the component using the normal react lifecycle methods.
Right now this is only available for the splash page and nav-bar components, whose interfaces are defined here.

Each component must be the default export of a javascript file which is specified in the (client) config JSON passed to auspice at build time (`auspice build` or `auspice develop`).


## Splash component

Build config property:
```json
{
  "splashComponent": "<javascript file>"
}
```

Available Props:
* `isMobile` boolean
* `available` available datasets and narratives
* `browserDimensions` broswer width & height
* `dispatch` callback
* `errorMessage` callback
* `changePage` callback


## Nav-bar component

Build config property:
```json
{
  "navbarComponent": "<javascript file>"
}
```

Available props:
* `narrativeTitle` string
* `sidebar` boolean. Is it to be displayed in the sidebar?

The navbar also receives the (possibly customised) sidebar theme which can be used to style components.



