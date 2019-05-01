---
title: API
---

> These will change 😱😱😱 this is taken from the v1 docs


## Sidebar Theme

The appearence of the sidebar can be customised by specifing a theme in the config JSON used to build auspice.
This theme is then available (via [styled-components](https://www.styled-components.com/)) to the components rendered in the sidebar.
It is also passed to the nav bar component as the `theme` prop.

```json
{
  "sidebarTheme": {
    "background": "#F2F2F2",
    "color": "#000",
    "sidebarBoxShadow": "rgba(0, 0, 0, 0.2)",
    "font-family": "Lato, Helvetica Neue, Helvetica, sans-serif",
    "selectedColor": "#5097BA",
    "unselectedColor": "#333"
  }
}
```



# Components

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
