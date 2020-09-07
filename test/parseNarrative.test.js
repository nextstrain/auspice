import { loadFront } from 'yaml-front-matter';
import * as parsers from "../src/util/parseNarrative";

/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] title is correctly converted to a ## (h2) heading", () => {
  const md = parsers.parseTitleSlideTitle(loadFront(`---
title: "narrative title"
---`));
  expect(md).toEqual("## narrative title\n");
});


/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] a single string representing authorship", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors: "Author Name (perhaps multiple)"
---`));
  expect(md).toEqual("### Author: Author Name (perhaps multiple)\n");
});

/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] single string of authors + string of link(s)", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors: "Author Name (perhaps multiple)"
authorLinks: "a_single_link"
---`));
  expect(md).toEqual("### Author: [Author Name (perhaps multiple)](a_single_link)\n");
});

/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] single string of authors + string of link(s) + string affiliation", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors: "Author Name (perhaps multiple)"
authorLinks: "a_single_link"
affiliations: "string of affiliations"
---`));
  expect(md).toEqual("### Author: [Author Name (perhaps multiple)](a_single_link) <sup> 1 </sup>\n<sub><sup> 1 </sup> string of affiliations</sub>\n");
});

/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] single string of author(s), no links, string affiliation", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors: "Author Name (perhaps multiple)"
affiliations: "string of affiliations"
---`));
  expect(md).toEqual("### Author: Author Name (perhaps multiple) <sup> 1 </sup>\n<sub><sup> 1 </sup> string of affiliations</sub>\n");
});


/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] single string of author(s) + array of links. Links should be ignored.", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors: "Author Name (perhaps multiple)"
authorLinks:
  - url_p1
  - url_p2
---`));
  expect(md).toEqual("### Author: Author Name (perhaps multiple)\n");
});


/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] authors (array) + links (array)", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors:
  - Person One
  - Person Two
authorLinks:
  - url_p1
  - url_p2
---`));
  expect(md).toEqual("### Author: [Person One](url_p1), [Person Two](url_p2)\n");
});

/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] authors (array) + links (array of different length). Links should be ignored.", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors:
  - Person One
  - Person Two
authorLinks:
  - url_p1
  - url_p2
  - url_p3
---`));
  expect(md).toEqual("### Author: Person One, Person Two\n");
});

/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] authors (array) + affiliations (string)", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors:
  - Person One
  - Person Two
affiliations: "shared affiliation for all authors"
---`));
  expect(md).toEqual("### Author: Person One, Person Two <sup> 1 </sup>\n<sub><sup> 1 </sup> shared affiliation for all authors</sub>\n");
});

/* ---------------------------------------------------------------------- */

test("[narrative frontmatter] authors (array) + links (array) + affiliations (string)", () => {
  const md = parsers.parseNarrativeAuthors(loadFront(`---
authors:
  - Person One
  - Person Two
authorLinks:
  - url_p1
  - url_p2
affiliations: "shared affiliation for all authors"
---`));
  expect(md).toEqual("### Author: [Person One](url_p1), [Person Two](url_p2) <sup> 1 </sup>\n<sub><sup> 1 </sup> shared affiliation for all authors</sub>\n");
});

/* ---------------------------------------------------------------------- */

