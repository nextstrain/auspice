---
title: "Example of a slide defining an invalid dataset"
date: "June 2020"
dataset: "https://nextstrain.org/zika?d=map"
abstract: "This narrative defines a second dataset which is inaccessible by (locally running) auspice and should display an error."
---

# [Summary](https://nextstrain.org/dataset-doesnt-exist?c=region&d=tree&legend=open&onlyPanels&p=full&sidebar=closed)

This slide defines a dataset that is not valid for a local auspice server.
We should see a red error notification alerting the user of this.
The displayed dataset should be zika, as that is what the YAML frontmatter defines.
I'm unsure of what the query (i.e. viz settings) should be.

Note that this list of datasets available to a locally running auspice instance is assumed to be those fetched by `npm run get-data` in a from-source auspice installation.



# [Valid (ebola) dataset](https://nextstrain.org/ebola?d=map)

This slide should switch to the West African EBOV dataset.