---
title: Input file formats
---

This page defines the format of the dataset JSONs which auspice visualises.
If you are running auspice locally, these are the only files you need to worry about.
For the format of the server reponses (if you are customising auspice) [see here](customisations/server/charonAPI.md).


> Please note that we also build bioinformatic tooling ([augur](https://nextstrain.org/docs/bioinformatics/introduction)) which produces JSONs specifically for visualisation in Auspice.
However any compatible JSONs can be visualised by auspice.
The data doesn’t have to be viral genomes, or real-time, or generated in Augur!
We’re working on adding tutorials on how to convert BEAST results etc into the formats used by Auspice.


> The current format of JSONs is in flux.
When this branch is released it will require a unified JSON (schema v2.0) which you can [see here](https://github.com/nextstrain/augur/blob/master/augur/data/schema.json).
Helper functions will be available to convert between version 1.0 schemas and version 2.0.
