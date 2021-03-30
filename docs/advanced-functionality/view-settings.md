# View Settings


View settings refer to things such as how we display the tree (radal? root-to-tip?), what panels we display (map? tree? both?), what colouring we are using etcetera.
There are three ways these can be controlled:
1. The defaults are configured by the dataset creators (and stored as "display defaults" in the dataset JSON).
This allows 
2. Interacting with the visualisation (e.g. changing the color-by) modifies the view, and the URL is changed accordingly.
For instance, change [nextstrain.org/zika](https://nextstrain.org/zika) to have a color-by of author, and you'll see the URL silently update to [?c=author](https://nextstrain.org/zika?c=author).
If you reload the page or share this URL, then the color-by is set via this URL.
3. Narratives, in which the narrative author chooses different "views" for each page, are created by associating each page with a URL (see (2)) which defines a specific view into the data.

## Auspice (hardcoded) defaults

Auspice has some hardcoded defaults, largely for historical reasons.
Each of these can be overridden by the JSON `display_defaults`, and then the view can be further modified by the URL query (see below).

* Default phylogeny layout is rectangular.
* Default phylogeny distance measure is time, if available.
* Default geographic resolution is "country", if available.
* Default colouring is "country", if available.
* Default branch labelling is "clade", if available.

## Dataset (JSON) configurable defaults

These are exported as the (optional) property of the dataset JSON `meta.display_defaults` (see JSON schema [here](https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v2.json)).
The defaults (as set here) will be what are displayed when the page is loaded with no URL queries, but be aware that URL queries (see below) can modify how the view looks.
For instance, if you set `display_defaults.color_by` to `country`, but load the page with `?c=region` then the view will be coloured by region.

| Property            | Description     | Example |
| -------------       | -------------   | ------- |
| `color_by`          | Colouring             | "country" |
| `geo_resolution`    | Geographic resolution | "country" |
| `distance_measure`  | Phylogeny x-axis measure     | "div" or "num_date" |
| `map_triplicate`    | Should the map repeat, so that you can pan further in each direction? | Boolean |
| `layout`            | Tree layout        | "rect", "radial", "unrooted", "clock" or "scatter" |
| `branch_label`      | Which set of branch labels are to be displayed | "aa", "lineage" |
| `panels`            | List of panels which (if available) are to be displayed  | ["tree", "map"] |
| `transmission_lines`| Should transmission lines (if available) be rendered on the map?  | Boolean |
| `language`          | Language to display Auspice in  | "ja" |

Note that `meta.display_defaults.panels` (optional) differs from `meta.panels` (required), where the latter lists the possible panels that auspice may display for the dataset.
See the [JSON schema](https://github.com/nextstrain/augur/blob/master/augur/data/schema-export-v2.json) for more details.

**See this in action:**

For instance, go to [nextstrain.org/flu/seasonal/h3n2/ha/2y](https://nextstrain.org/flu/seasonal/h3n2/ha/2y) and you'll see how the colouring is "Clade" -- this has been set via the `display_defaults` in the JSON.

## URL query options

URL queries are the part of the URL coming after the `?` character, and typically consist of `key=value` -- for instance [nextstrain.org/zika?c=author](https://nextstrain.org/zika?c=author) has a query with a key `c` and value `author`.
Multiple queries are separated by the `&` character.
All URL queries modify the view away from the default settings -- if you change back to a default then that URL query will dissapear.

| Key        | Description | Example(s)  |
| ---        | ----------- | --------------  |
| `c`        | Colouring to use | `c=author`, `c=region` |
| `r`        | Geographic resolution | `r=region` |
| `m`        | Phylogeny x-axis measure | `m=div` |
| `l`        | Phylogeny layout | `l=clock` |
| `scatterX` | Scatterplot X variable | `scatterX=num_date` |
| `scatterY` | Scatterplot Y variable | `scatterY=num_date` |
| `branches` | Hide branches | `branches=hide` |
| `regression` | Show/Hide regression line | `regression=hide`, `regression=show` |
| `transmissions` | Hide transmission lines | `transmissions=hide`|
| `lang`     | Language | `lang=ja` (Japanese) |
| `dmin`     | Temporal range (minimum) | `dmin=2008-05-13` |
| `dmax`     | Temporal range (maximum) | `dmax=2010-05-13` |
| `f_<name>` | Data filter. Multiple values per key are `,` separated. | `f_region=Oceania` |
| `gt`       | Genotype filtering |
| `d`        | List of panels to display, `,` separated | `d=tree,map` |
| `p`        | Panel layout (buggy!) | `p=full`, `p=grid` |
| `gmin`     | Entropy panel zoom (minimum) bound | `gmin=1000` |
| `gmin`     | Entropy panel zoom (maximum) bound | `gmax=2000` |
| `animate`  | Animation settings | |
| `n`        | Narrative page number | `n=1` goes to the first page |
| `s`        | Selected strain | `s=1_0199_PF` |
| `branchLabel` | Branch labels to display | `branchLabel=aa` |
| `label`    | Labeled branch that tree is zoomed to | `label=clade:B3`, `label=lineage:relapse` |
| `clade`    | _DEPRECATED_ Labeled clade that tree is zoomed to | `clade=B3` should now become `label=clade:B3` |
| `sidebar`  | Force the sidebar into a certain state | `sidebar=closed` or `sidebar=open` |
| `legend`  | Force the legend into a certain state | `legend=closed` or `legend=open` |
| `onlyPanels` | Do not display the footer / header. Useful for iframes. | `onlyPanels` |
| `ci`       | Display confidence intervals on the tree. | `ci` |

**See this in action:**

For instance, go to [nextstrain.org/flu/seasonal/h3n2/ha/2y?c=num_date&d=tree,map&m=div&r=region](https://nextstrain.org/flu/seasonal/h3n2/ha/2y?c=num_date&d=tree,map&m=div&p=grid&r=region) and you'll see how we've changed the coloring to a temporal scale (`c=num_date`), we're only showing the tree & map panels (`d=tree,map`), the tree x-axis is divergence (`m=div`) and the map resolution is region (`r=region`).
