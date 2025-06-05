---
title: Simultaneous Updates to Tree State
authors:
  - James Hadfield
authorLinks:
  - https://twitter.com/hamesjadfield
affiliations: "Fred Hutch"
dataset: "http://localhost:4000/flu/seasonal/h3n2/ha/3y?d=tree&c=num_date"
date: June 2020
abstract: "A narrative to explore simultaneous changes to tree state. The aim is both to reveal what's possible, and to prevent future regressions via automated testing."
---


# [P1: Change coloring to clade](http://localhost:4000/flu/seasonal/h3n2/ha/3y?d=tree&branchLabel=aa)

Check that both the branches and tips update. (The clade coloring is the default, so this slide removes the previous `c=num_date` query)

The clade labels should now show selected amino acids (with the selecting being done by auspice).

# [P2: Zoom in via filtering & "zoom-to-selected"](http://localhost:4000/flu/seasonal/h3n2/ha/3y?d=tree&branchLabel=aa&f_clade_membership=3C.2a1b.2a.1,3C.2a1b.2a.2&treeZoom=selected)

We add two clade filters: "3C.2a1b.2a.1" & "3C.2a1b.2a.2" and the URL query `treeZoom=selected` which zooms into their CA
(which does not have its own branch label)


# [P3: Zoom in further](http://localhost:4000/flu/seasonal/h3n2/ha/3y?d=tree&c=num_date&label=clade:3C.2a1b.2a.2&branchLabel=aa&showBranchLabels=all)

We simultaneously zoom into clade 3C.2a1b.2a.2 (top right section) and show _all_ AA mutations as branch labels.
If you go to the previous slide(s) the aa mutation labels should revert to only showing a subset.

# [P4: Zoom out to clade 3C.2a1b.2 _and_ change color](http://localhost:4000/flu/seasonal/h3n2/ha/3y?d=tree&label=clade:3C.2a1b.2)

Check that the coloring of the branches and tips update as we zoom out (slightly).

The coloring should be back to the default (clade), and so should the branch labels (clade also).

# [P5: Lots of simultaneous changes](http://localhost:4000/flu/seasonal/h3n2/ha/3y?c=lbi&d=tree&dmin=2017-01-01&f_region=North%20America&label=clade:3C.2a&m=div)
* Zoomed out to near the root (clade 3C.2a)
* Changed the horizontal scale to divergence
* Changed the color-by to LBI (and legend should be open)
* Kept the North American region filter (i.e. the majority of tips are not visible).
* Time slice excludes pre-2017 samples (note that we don't have the grey overlay here since the axis is divergence)

# [P6: Layout change (and others)](http://localhost:4000/flu/seasonal/h3n2/ha/3y?branchLabel=none&d=tree&l=radial&m=div)
Underneath, this uses a different set of d3 calls where instead of transitioning all elements (branches, tips etc), which is too slow, we do a "in-parts" update: we hide the branches, transition the tips, then redraw the branches in their new position.
This slide should
* switch to radial view
* zoom out to show the entire tree, and remove filters so all tips should be shown
* change the coloring to clade