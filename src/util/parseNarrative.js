/**
 * This file, although residing in `src` is also used by the server.
 * This is to maintain a common source of code for narrative markdown
 * parsing both server-side and client-side, thus preserving backwards
 * capability with auspice from when it was only done on the server.
 * Because we do not transpile the server code (a conscious decision)
 * this means we should not use any import statements here, and
 * export functions via the `module.exports` syntax (applies
 * to "imported" code also).
 */

/* eslint no-param-reassign: off */

const { loadFront } = require('yaml-front-matter');
const queryString = require("query-string");


const parseMarkdownNarrativeFile = (fileContents, markdownParser) => {
  const frontMatter = loadFront(fileContents);

  if (Object.keys(frontMatter).length === 1) {
    const notMarkdownError = new Error();
    notMarkdownError.fileContents = fileContents;
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

function parseNarrativeBody(markdown, fallbackDataset, markdownParser) {
  return markdown
    .replace(/\r\n/g, "\n") // handle files with CRLF endings (windows)
    .split("\n")
    /* reduce the array of lines into an array of slides */
    .reduce((slides, currentLine) => {
      const { lineIndicatesNewSlide, title, urlString} = checkIfLineIndicatesNewSlide(currentLine);
      if (!slides.length && !lineIndicatesNewSlide) return slides; // content pre 1st slide title is ignored
      if (lineIndicatesNewSlide) {
        return [...slides, {lines: [`# ${title}`], urlString}];
      }
      slides[slides.length-1].lines.push(currentLine);
      return slides;
    }, [])
    /* for each slide, parse out the mainDisplayMarkdownBlock, if it exists */
    .map((slide) => addMainMarkdownBlock(slide))
    /* transform each slide into the object that the client expects */
    .map((slide) => {
      const transformed = {
        ...parseUrl(slide.urlString, fallbackDataset),
        __html: markdownParser(slide.lines.join("\n"))
      };
      if (slide.mainMarkdownLines) {
        // this doesn't get transformed to HTML until a later stage.
        transformed.mainDisplayMarkdown = slide.mainMarkdownLines.join("\n");
      }
      return transformed;
    });
}

function checkIfLineIndicatesNewSlide(line) {
  if (!line) return {};
  const fields = line.match(/^\s*#\s*\[(.+?)\]\((.+?)\)\s*$/);
  if (!fields || fields.length!==3) return {};
  return {
    lineIndicatesNewSlide: true,
    title: fields[1],
    urlString: fields[2]
  };
}

/**
 * Narratives can define a "auspiceMainDisplayMarkdown" fenced code block
 * where the content of the code block is markdown to be displayed in the
 * main part of auspice, replacing the panels.
 * We should explore nicer ways of doing this, whilst maintaining backwards
 * compat
 */
function addMainMarkdownBlock(slide) {
  const sidebarLines = [];
  const mainMarkdownLines = [];
  let inMainMarkdownSection = false;
  slide.lines.forEach((line) => {
    if (!inMainMarkdownSection && line.match(/^```auspiceMainDisplayMarkdown\s*$/)) {
      inMainMarkdownSection = true;
      return;
    }
    if (inMainMarkdownSection && line.match(/^```\s*/)) {
      inMainMarkdownSection = false;
      return;
    }
    if (inMainMarkdownSection) {
      mainMarkdownLines.push(line);
    } else {
      sidebarLines.push(line);
    }
  });
  if (mainMarkdownLines.length) {
    return {...slide, lines: sidebarLines, mainMarkdownLines};
  }
  return slide;
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
