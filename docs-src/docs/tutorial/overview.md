---
title: Interpreting data with Auspice
---

> We need some form of tutorials / explanation of what you can do in the app and (I hope) what biological insights can be gleamed.
Potentially, these could be done using narratives, or, since narratives are basically the same file format as these docs pages we could essentially use the same file for both. 
It'd be great to also have a page focusing on a single dataset (WNV might be good for this).


>This is the content from nextstrain.org/docs:


Visualisation of bioinformatics results is an integral part of current phylodynamics, both for data exploration and communication.
We wanted to build a tool that was highly interactive, versatile and usable as communication platform to quickly disseminate results to the wider community.
Auspice is written in JavaScript and is the app that powers all the phylogenomic analysis on nextstrain.org (github repo [here](https://www.github.com/nextstrain/auspice)).


![mumps](assets/mumps.png)
*Auspice displaying Mumps genomes from North America. See [nextstrain.org/mumps/na](https://www.nextstrain.org/mumps/na)*


### General design overview
We wanted to build a powerful yet not overly complex visualisation tool.
Currently this is centered around a number of "panels".
These allow us to display relationships between isolates such as their phylogenetic relationships, putative transmissions on the map, variability across the genome.
Colour is used consistently throughout the app in order to link different panels.
The generator of the data controls which traits are able to be visualised - for instance, transmissions can be turned off if the data is not informative.
A number of controls are made available in a sidebar to control the time period viewed, the layout of the tree etc.

We are currently working on allowing scientists to author custom narratives which describe the data, and control how the data is visualised as one progresses through the narrative.
See [here](/docs/visualisation/narratives) for more information.