const marked = require('marked');
const yamlFront = require('yaml-front-matter');  /* https://www.npmjs.com/package/yaml-front-matter */
const utils = require("../utils");

const blockProxyHandler = {
  set: (target, key, value) => {
    if (key === "url") {
      const urlParts = value.match(/.*(nextstrain.org|localhost).*?\/+([^?\s]+)\??(\S*)/);
      target.dataset = urlParts[2];
      target.query = urlParts[3];
      return true;
    } else if (key === "contents") {
      target.__html = marked(value, {sanitize: false, gfm: true, tables: true});
      return true;
    }
    return false;
  }
};

const makeFrontMatterBlock = (frontMatter) => {
  if (!frontMatter.title || !frontMatter.dataset) {
    throw new Error("Incorrectly formatted frontmatter in narrative file");
  }
  /* create markdown to represent the title page */
  const markdown = [];
  markdown.push(`# ${frontMatter.title}`);
  if (frontMatter.authors) {
    if (typeof frontMatter.authors === 'object' && Array.isArray(frontMatter.authors)) {
      utils.warn(`Narrative parsing -- can't do author arrays yet`);
    } else if (typeof frontMatter.authors === 'string') {
      if (frontMatter.authorLinks && typeof frontMatter.authorLinks === "string") {
        markdown.push(`### Author: [${frontMatter.authors}](${frontMatter.authorLinks})`);
      } else {
        markdown.push(`### Author: ${frontMatter.authors}`);
      }
      if (frontMatter.affiliations && typeof frontMatter.affiliations === "string") {
        markdown[markdown.length-1] += " <sup> 1 </sup>";
        markdown.push(`<sup> 1 </sup> ${frontMatter.affiliations}`);
      }
    }
  }
  if (frontMatter.date && typeof frontMatter.date === "string") {
    markdown.push(`### Created: ${frontMatter.date}`);
  }
  if (frontMatter.updated && typeof frontMatter.updated === "string") {
    markdown.push(`### Updated: ${frontMatter.updated}`);
  }
  if (frontMatter.abstract && typeof frontMatter.abstract === "string") {
    markdown.push(`#### ${frontMatter.abstract}`);
  }

  const block = new Proxy({}, blockProxyHandler);
  block.url = frontMatter.dataset;
  block.contents = markdown.join("\n");
  return block;
};

/**
 * parses text (from the narrative markdown file)
 * into blocks.
 * Returned object (blocks) has properties "__html", "dataset", "query"
 * and will be sent (in JSON form) to the client
 * @param {string} fileContents string representing the entire markdown file
 * @return {obj}
 */
const parseNarrativeFile = (fileContents) => {
  const blocks = [];
  const frontMatter = yamlFront.loadFront(fileContents);

  const titlesAndParagraphs = frontMatter.__content
    .split(/\n*[#\s]+(\[.+?\]\(.+?\))\n+/)  // matches titles defined as: # [title](url)
    .filter((e) => !e.match(/^\s*$/));      // remove empty paragraphs (often leading / trailing)

  /* process the frontmatter content */
  blocks.push(makeFrontMatterBlock(frontMatter));

  /* process the markdown content */
  const isTitle = (s) => s.match(/^\[.+?\]\(.+?\)$/);
  let idx = 0;
  while (idx < titlesAndParagraphs.length) {
    if (!isTitle(titlesAndParagraphs[idx])) {
      idx++; continue;
    }

    /* want to capture the following groups:
    title text (1st element) and URL, possibly including query (2nd element) */
    const matches = titlesAndParagraphs[idx].match(/\[(.+?)\]\((\S+)\)/);
    let paragraphContents = `# ${matches[1]}\n`; // the title text
    /* add in the next paragraph _if_ it's not itself a title */
    if (!isTitle(titlesAndParagraphs[++idx])) {
      paragraphContents += titlesAndParagraphs[idx++];
    }

    const block = new Proxy({}, blockProxyHandler);
    block.url = matches[2];
    block.contents = paragraphContents;
    blocks.push(block);
  }

  return blocks;
};


module.exports = {
  default: parseNarrativeFile
};
