---
title: Sidecar file loading from narratives
authors:
  - James Hadfield
authorLinks:
  - https://twitter.com/hamesjadfield
affiliations: "Fred Hutch"
dataset: "http://localhost:4000/ebola?d=map"
abstract: "A narrative to test the loading of sidecar files across multiple datasets. This slide should show the ebola map coloured by division."
---


# [Ebola GP:500E](http://localhost:4000/ebola?c=gt-GP_500&d=tree)

Colouring the tree by codon 500 in GP (E / Glu) requires the root-sequence sidecar file 
to be fetched. When transitioning from the first slide to this one, we expect it to
have been fetched and thus we should see a teal-coloured tree straight away.
When starting the narrative from this slide, we should see the tree flash grey before
teal as the sidecar file is fetched subsequent to the main file.


#### Checklist: refresh the page from this slide & ensure colouring arrives


# [Influenza H3N2 frequencies](http://localhost:4000/flu/seasonal/h3n2/ha/2y?d=tree,frequencies)


Here we should see both the tree panel and the frequencies panel. When reloading the narrative
from this page we should see the frequencies panel appear slightly later as the sidecar file arrives.

#### Checklist: refresh the page from this slide

# [Influenza Vic frequencies and root-sequence](http://localhost:4000/flu/seasonal/vic/ha/2y?c=gt-HA1_100&d=tree,frequencies)

Here we should see both the tree panel and the frequencies panel for a non-varying codon.
When reloading the narrative from this page we should see the frequencies panel appear slightly later as the sidecar file arrives,
as well as the colouring changing from grey to teal. The order of those updates may be inversed.

#### Checklist: refresh the page from this slide

# [Tanglegram of previous two flu trees](http://localhost:4000/flu/seasonal/vic/ha/2y:flu/seasonal/h3n2/ha/2y?c=gt-HA1_100&d=tree,entropy,frequencies)

A tanglegram of Vic and H3N2 makes little sense, but we should see the trees lined up.

The left tree (Vic) should be coloured teal. When reloading the page this should initially flash grey.

The URL specifies that we should also see _both_ the entropy and the frequencies panel,
however this functionality does not yet exist in Nextstrain narratives when viewing a tangletree.

#### Checklist: refresh the page from this slide
