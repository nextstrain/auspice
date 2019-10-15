---
title: "Communicating results using Narratives"
---

Narratives are a method of data-driven storytelling.
They allow scientists (or anyone!) to author content which is displayed alongside the "normal" auspice view of the data.
This content drives the way in which data is displayed, so instead of the user changing how things are displayed, the view automatically changes as you move between paragraphs in the narrative.
This allows you to communicate results with the appropriate views into the data, whilst maintaining the ability for the user to jump back to the "normal" viewing mode and interact with the data.

## Examples

Narratives are easier to understand with examples:

We've been looking into West Nile Virus (WNV) spread throughout North America and used auspice to visualise the spread of the virus from east to west over a 20 year period.
To communicate these results, we constructed a narrative to walk people through this, which we suggest you go take a look at to grasp the power of narratives 


> _Click the link 👇 and explore the content by scrolling the text in the left hand panel (or click on the arrows)._
_The data visualizations will change accordingly._
_Clicking "explore the data yourself" above will display sidebar controls._

**Example #1**: [Twenty years of West Nile virus (nextstrain.org)](https://nextstrain.org/narratives/twenty-years-of-WNV)


Hopefully that gave you an idea about how the interplay between bits of text and views into the data allows for better communication of our interpretation of the data.
Did you notice that, at any point in the narrative, people can dive into the data themselves if they want to?

---

Here's another example written to show the various auspice views you can utilise in narratives:

**Example #2**: [Exploring the narrative functionality using the ongoing mumps epidemic in North America (nextstrain.org)](https://nextstrain.org/narratives/intro-to-narratives).

We'll go through this in more detail in the [writing a narrative](how-to-write.md) docs.





## How to write a narrative

If you have a dataset that you (or anyone else) created then you can write a narrative to enhance it 💫

Behind the scenes a narrative is a single markdown file written in a particular format -- i.e. each of the example narratives linked above comprised one markdown file each.
The [writing a narrative](how-to-write.md) tutorial will use the mumps example from above to explain how you can write your own narrative.



## Sharing narratives

If you've got a narrative working locally (i.e. running auspice on your computer) and want to share the results then you have two options:
1. Implement an auspice server yourself (the harder option, see [the server documentation](server/introduction.md)).
2. Use the community functionality of nextstrain.org (the easier option, detailed in [writing a narrative](narratives/how-to-write.md#step-6-upload-your-example-to-nextstrain-community-to-share-with-everyone)).




## Known Bugs / Limitations

Narratives are now being used in various settings, however some bugs remain.
Please [get in touch (email)](mailto:hello@nextstrain.org) with any and all questions about narratives, or [file an issue on GitHub](https://github.com/nextstrain/auspice/issues/new) 🙏

* Datasets currently cannot be changed between paragraphs (i.e. the initial dataset is used for all subsequent paragraphs).

* Text which is larger than the sidebar / page height is cut off.

* Styling may be slightly off on different browsers.

* Not all state is mirrored in the URLs (for instance, map bounds are not set in the URL).
This limits what views can be defined by paragraphs in the narratives.

* The frontmatter parsing will be extended to allow arrays of authors (etc).

Take a look at the [GitHub issues tagged as related to narrative functionality](https://github.com/nextstrain/auspice/labels/narratives) for a potentially more up-to-date list of these.