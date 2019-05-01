---
title: "Writing a narrative"
---

> INCOMPLETE. It should contain a bit of a tutorial as well, which we actually have made live so one can see the results.

A narrative is simply a [markdown](https://en.wikipedia.org/wiki/Markdown) file with some quirks.
"Views" into the data are defined by specifying a nextstrain URL in each paragraph's header which represents this view -- i.e. simply manipulate the app into the view you want and copy the resulting URL into the markdown file.
It's that simple 🎉.



## YAML frontmatter
This defines the author, title and initial dataset.
It must appear at the top of the narrative file, and looks like:

```yaml
---
title: "The current seasonal influenza A/H3N2 situation"
authors: "James Hadfield"
authorLinks: "https://twitter.com/hamesjadfield"
affiliations: "Fred Hutch, Seattle, USA"
date: "January 2018"
updated: "August 2018"
dataset: "https://nextstrain.org/local/flu/seasonal/h3n2/ha/3y?d=tree&p=full&c=num_date"
abstract: "This text serves as the abstract. This is optional."
---
```
Note that all the fields are optional, except for dataset, title & authors.



## Paragraphs
Each paragraph must start with a heading consisting of a link.
This link defines the dataset & settings used to display the data associated with the paragraph's content.
For instance, this paragraph displays the influenza A/H3N2 dataset, displaying only the phylogenetic tree & frequency panels, coloured by region and highlighting sequences collected since 2017. (The URL was obtained by manipulating the [nextstrain.org/flu](https://www.nextstrain.org/flu) page into the desired configuration).

```markdown
# [The situation since 2017](https://nextstrain.org/flu/seasonal/h3n2/ha/3y?c=region&d=tree,frequencies&dmin=2017-01-01&p=full)

These data show...
```

> Note that currently, the dataset can't change between paragraphs and that paragraphs which are too long are cut off (see "known limitations" below).
