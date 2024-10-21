/* eslint no-param-reassign: off */

const { safeLoadFront } = require('yaml-front-matter');
const queryString = require("query-string");


const parseMarkdownNarrativeFile = (fileContents, markdownParser) => {
  const frontMatter = safeLoadFront(fileContents);

  if (Object.keys(frontMatter).length === 1) {
    const notMarkdownError = new Error();
    notMarkdownError.fileContents = fileContents;
    notMarkdownError.message = "YAML frontmatter missing or incomplete from narrative file";
    throw notMarkdownError;
  }

  const titleSlide = createTitleSlideFromFrontmatter(frontMatter, markdownParser);
  return [
    titleSlide,
    ...parseNarrativeBody(frontMatter.__content, titleSlide.dataset, markdownParser)
  ];
};


function createTitleSlideFromFrontmatter(frontMatter, markdownParser) {
  let markdown = ""; // A markdown interpretation of the YAML for display

  markdown += parseTitleSlideTitle(frontMatter);
  markdown += parseNarrativeAuthors(frontMatter);
  markdown += parseNarrativeTranslators(frontMatter);
  if (frontMatter.abstract && typeof frontMatter.abstract === "string") {
    markdown += `### ${frontMatter.abstract}\n`;
  }
  if (frontMatter.date && typeof frontMatter.date === "string") {
    markdown += `#### Created: ${frontMatter.date}\n`;
  }
  if (frontMatter.updated && typeof frontMatter.updated === "string") {
    markdown += `#### Updated: ${frontMatter.updated}\n`;
  }
  const license = parseAttributions(frontMatter, "license", "licenseLink");
  if (license) markdown += `#### License: ${license}\n`;
  return {
    ...parseUrl(frontMatter.dataset),
    __html: markdownParser(markdown)
  };
}

function parseTitleSlideTitle(frontMatter) {
  if (!frontMatter.title) throw new Error("Narrative YAML frontmatter must define a title!");
  return `## ${frontMatter.title}\n`;
}

function parseUrl(urlString, fallbackDataset=false) {
  let url, dataset;
  try {
    url = new URL(urlString);
  } catch (err) {
    if (fallbackDataset) {
      console.error(`Couldn't parse the URL "${urlString}". Falling back to "${fallbackDataset}".`);
      return {dataset: fallbackDataset, query: ""};
    }
    throw new Error("Narrative YAML frontmatter must define a valid dataset URL!");
  }

  if (url.pathname) {
    dataset = url.pathname;
  } else if (fallbackDataset) {
    console.error(`The URL "${urlString}" didn't define a dataset! Falling back to "${fallbackDataset}".`);
    dataset = fallbackDataset;
  } else {
    throw new Error("Narrative YAML frontmatter must define a valid dataset URL!");
  }

  const query = queryString.stringify(queryString.parse(url.search));

  return {dataset, query};
}

function* parseNarrativeBody(markdown, fallbackDataset, markdownParser) {
  const html = markdownParser(markdown);
  const doc = (new DOMParser()).parseFromString(html, "text/html");

  /* Each <h1> with only a link (in Markdown "# [text](href)") defines a new
   * slide.  Note this skips over and ignores anything before the first slide.
   *
   * I'd use "h1:has(> a:only-child)" if it was broadly supported, as this
   * would select the <h1> instead of the inner <a> and make it possible to use
   * node.matches(…) instead of node.querySelector().
   *   -trs, 21 Nov 2022
   */
  const titleLinkSelector = "h1 > a:only-child";
  const isTitle = (node) =>
    node.nodeType === Node.ELEMENT_NODE &&
    node.querySelector(titleLinkSelector) !== null;

  for (const titleLink of doc.querySelectorAll(titleLinkSelector)) {
    const slide = doc.createElement("slide");
    const {dataset, query} = parseUrl(titleLink.href, fallbackDataset);

    /* Turn <h1><a>some title</a></h1> into <h1>some title</h1>; we've
     * extracted the link itself above with parseUrl().
     */
    const h1 = titleLink.parentElement;
    titleLink.replaceWith(titleLink.textContent);

    /* Start collecting the slide's content into a <slide> container.
     *
     * First, turn <h1>some title</h1> into <slide><h1>some title</h1></slide>.
     */
    h1.replaceWith(slide);
    slide.appendChild(h1);

    /* Then, walk forward moving nodes into this <slide> until we hit the next
     * slide's title (or the end of the document).
     */
    let sibling;
    while ((sibling = slide.nextSibling)) {
      if (isTitle(sibling)) break;
      slide.appendChild(sibling);
    }

    /* Finally, extract the text of any auspiceMainDisplayMarkdown code blocks
     * and remove them from the slide itself (for handling later).
     */
    let mainDisplayMarkdown = "";

    for (const code of slide.querySelectorAll("pre > code.language-auspiceMainDisplayMarkdown")) {
      mainDisplayMarkdown += code.textContent + "\n";
      code.parentElement.remove();
    }

    // We're done with this slide, emit it!
    yield {
      dataset,
      query,
      mainDisplayMarkdown,
      __html: slide.innerHTML
    };
  }
}

function parseNarrativeAuthors(frontMatter) {
  let authorMd = "";
  const authors = parseAttributions(frontMatter, "authors", "authorLinks");
  if (authors) {
    authorMd += `### Author: ${authors}`;
    if (frontMatter.affiliations && typeof frontMatter.affiliations === "string") {
      authorMd += " <sup> 1 </sup>";
      authorMd += `\n<sub><sup> 1 </sup> ${frontMatter.affiliations}</sub>`;
    }
  }
  return authorMd+"\n";
}

function parseNarrativeTranslators(frontMatter) {
  const translators = parseAttributions(frontMatter, "translators", "translatorLinks");
  if (translators) return `### Translators: ${translators}\n`;
  return "";
}

/**
 * A helper function for parsing a key with (optional) links.
 * The complexity here comes from the desire to be backward compatible with a
 * number of prototype frontmatter schemas. See the tests for this function for
 * more details, in lieu of some proper documentation.
 */
function parseAttributions(frontMatter, attributionsKey, attributionLinksKey) {
  const attributions = frontMatter[attributionsKey];
  const attributionLinks = frontMatter[attributionLinksKey];

  if (Array.isArray(attributions)) {
    return parseAttributionsArray(attributions, attributionLinks, attributionsKey, attributionLinksKey);
  } else if (typeof attributions === 'string') {
    return parseAttributionsString(attributions, attributionLinks, attributionsKey, attributionLinksKey);
  }
  return undefined;
}

function parseAttributionsArray(attributions, attributionLinks, attributionsKey, attributionLinksKey) {
  // validate links
  if (attributionLinks) {
    if (!Array.isArray(attributionLinks)) {
      console.warn(`Narrative parsing - if ${attributionsKey} is an array, then ${attributionLinksKey} must also be an array. Skipping links.`);
      attributionLinks = undefined;
    } else if (attributionLinks.length !== attributions.length) {
      console.warn(`Narrative parsing - the length of ${attributionsKey} and ${attributionLinksKey} did not match. Skipping links.`);
      attributionLinks = undefined;
    }
  }
  if (attributionLinks) {
    attributions = attributions.map((attribution, idx) => {
      return attributionLink(attribution, attributionLinks[idx]);
    });
  }
  return attributions.join(", ");
}

function parseAttributionsString(attributions, attributionLinks, attributionsKey, attributionLinksKey) {
  // validate links
  if (attributionLinks) {
    if (typeof attributionLinks !== "string") {
      console.warn(`Narrative parsing - if ${attributionsKey} is a string, then ${attributionLinksKey} must also be a string. Skipping links.`);
      attributionLinks = undefined;
    }
  }
  return attributionLink(attributions, attributionLinks);
}

function attributionLink(attribution, attributionLinkValue) {
  if (attributionLinkValue) {
    return `[${attribution}](${attributionLinkValue})`;
  }
  return attribution;
}


module.exports = {
  parseMarkdownNarrativeFile,
  /* following functions exported for unit testing */
  createTitleSlideFromFrontmatter,
  parseTitleSlideTitle,
  parseNarrativeAuthors,
  parseNarrativeTranslators
};
