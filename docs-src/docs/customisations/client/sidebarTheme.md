---
title: Sidebar theming
---


The appearence of the sidebar can be customised by specifing a theme in the config JSON used to build auspice.
This theme is then available (via [styled-components](https://www.styled-components.com/)) to the components rendered in the sidebar.
It is also passed to the nav bar component as the `theme` prop.

> This interface is very experimental and will change frequently. Perhaps we'll use https://refactoringui.com/previews/building-your-color-palette/ as a guide to both naming and the number of properties available here.

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
