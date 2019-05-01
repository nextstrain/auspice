---
title: "Communicating results using Narratives"
---

> Content taken from nextstrain.org/docs. Needs to be updated.

Narratives are a method of data-driven storytelling.
They allow scientists (or anyone!) to author content which is displayed alongside the "normal" view of the data.
This content drives the way in which data is displayed, so instead of the user changing how things are displayed, the view automatically changes as you move between paragraphs in the narrative.
This allows you to communicate results with the appropriate views into the data, whilst maintaining the ability for the user to jump back to the "normal" viewing mode and interact with the data.


> Narratives are a new feature, and there may still be bugs.
We're aiming to publicise this feature as soon as we have ensured everything's working as desired.



## How to write a narrative
A narrative is simply a [markdown](https://en.wikipedia.org/wiki/Markdown) file with some quirks.
"Views" into the data are defined by specifying a nextstrain URL in each paragraph's header which represents this view -- i.e. simply manipulate the app into the view you want and copy the resulting URL into the markdown file.
It's that simple 🎉.

[This page](how-to-write.md) details excatly how to construct one.



## Sharing narratives

Similar to how community datasets in GitHub repositories are automatically accessible through [nextstrain.org](https://www.nextstrain.org), so are narratives.
Given a repository at **github.com/orgName/repoName**, if there is a folder named `narratives` with the markdown file **repoName.md**, then that dataset can be accessed via **nextstrain.org/community/narratives/orgName/repoName**.
Additional narratives named such as **repoName\_a\_b\_c.json** are available at **nextstrain.org/community/narratives/orgName/repoName/a/b/c**.


Our own narratives, which are stored in [this github repo](https://github.com/nextstrain/narratives) are available to view at [nextstrain.org/narratives](https://www.nextstrain.org/narratives).
We're currently working at adding content and tutorials to these!



## Known Bugs / Limitations
* Datasets cannot be changed between paragraphs (i.e. the initial dataset is used for all subsequent paragraphs).
This will be fixed eventually.
* Text which is larger than the sidebar / page height is cut off.
This should be fixed soon.
* Styling may be slightly off on different browsers.
* Not all state is mirrored in the URLs (for instance, map bounds are not set in the URL).
This limits what views can be defined by paragraphs in the narratives.
* The frontmatter parsing will be extended to allow arrays of authors (etc).
