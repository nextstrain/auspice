# Miscellaneous


## How auspice handles unknown or missing data

Attributes assigned to nodes in the tree -- such as `country` -- may have values which are _missing_ or _unknown_.
Auspice will ignore values such as these, and they will not be displayed in the legend or the tree info-boxes (e.g. hovering over the tree).
Tips & branches across the tree with values such as these will be gray. (Branches with low confidence for an inferred trait may also show as gray, and hovering over the branches will help identify this.)
Note that, if a discrete trait is selected, then a proportion of the pie-chart on the map may also be gray to represent the proportion of tips with missing data.


If a trait is not set on a node it is considered missing, as well as if (after coersion to lower-case) it has one of the following values:
```js
["unknown", "?", "nan", "na", "n/a", "", "unassigned"]
```
