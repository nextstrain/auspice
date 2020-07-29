---
title: Test narrative to use multiple datasets in a single narrative
authors: "James Hadfield"
authorLinks: "https://twitter.com/hamesjadfield"
affiliations: "Fred Hutch, Seattle, USA"
date: "2020-04-23"
dataset: "https://nextstrain.org/mumps/na?d=tree"
abstract: "This narrative is (temporarily) located within the github.com/nextstrain/narratives repo, but will probably be moved into the auspice repo shortly. It is intended to be used during development of multiple-dataset functionality, and after this is done may be used for testing purposes."
---


# [Opening dataset](https://nextstrain.org/mumps/na?d=tree)

The first slide uses the same dataset as the YAML frontmatter, namely it asks for the `/mumps/na` dataset with
a URL query of `d=tree` meaning that only the tree should be displayed.

We therefore should not see any changes between this slide and the preceeding (cover) slide.

<br/>

Please see [writing a narrative](https://nextstrain.github.io/auspice/narratives/how-to-write) for background on narrative syntax, the YAML frontmatter etc etc.

<br/>

Please see [GitHub issue 890](https://github.com/nextstrain/auspice/issues/890) for more information about how the dataset is defined within the YAML frontmatter and the blocks.

# [Different dataset](https://nextstrain.org/zika?d=tree,map)

This slide defines a different dataset (`/zika`) with URL query `d=tree,map` and thus the visualisation should change to the zika dataset and show both a tree and a map. (A quick way to check: the zika map includes south america and the pacific, whereas the mumps one is confined to North America.)

<br/>

On **current master**, this slide doesn't display errors, and the URL query is correctly interpreted, but the underlying dataset does not change. See [this line in the source code](https://github.com/nextstrain/auspice/blob/master/src/components/narrative/index.js#L57) for more.


<br/>

Going to the preceeding slide should change back to the North American mumps dataset.


# [zika tree only](https://nextstrain.org/zika?d=tree)

zika tree only