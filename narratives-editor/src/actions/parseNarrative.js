import {loadFront } from 'yaml-front-matter'; // eslint-disable-line import/no-extraneous-dependencies
import { makeFrontMatterBlock, blockProxyHandler, extractAuspiceMainDisplayMarkdown} from "../../../cli/server/parseNarrative";


/**
 * Not a redux action really
 */


/**
 * Copy & pasted, with modifications, from `parseNarrative.js` which is used by the auspice server
 * (and other servers, e.g. nextstrain.org, import the function). We've wanted to parse the markdown
 * on the client, so this can be seen as a prototype for that!
 */
export const parseNarrativeFile = (fileContents) => {
  const blocks = [];
  const frontMatter = loadFront(fileContents);

  const titlesAndParagraphs = frontMatter.__content
    .replace(/\r\n/g, "\n")                 // handle files with CRLF endings (windows)
    .split(/\n*[#\s]+(\[.+?\]\(.+?\))\n+/)  // matches titles defined as: # [title](url)
    .filter((e) => !e.match(/^\s*$/));      // remove empty paragraphs (often leading / trailing)

  /* process the frontmatter content */
  blocks.push(makeFrontMatterBlock(frontMatter));
  /* save the actual raw yaml for in-browser editing (regex is a suitable solution for the prototype only) */
  blocks[0].md = fileContents.replace(/\r\n/g, "\n").match(/(---\n[\S\s]+\n---\n)/)[1];

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
    let paragraphMarkdown = titlesAndParagraphs[idx]+"\n\n";
    /* add in the next paragraph _if_ it's not itself a title */
    if (!isTitle(titlesAndParagraphs[++idx])) {
      paragraphMarkdown += titlesAndParagraphs[idx];
      paragraphContents += titlesAndParagraphs[idx++];
    }

    let mainDisplayMarkdown;
    [paragraphContents, mainDisplayMarkdown] = extractAuspiceMainDisplayMarkdown(paragraphContents);

    const block = new Proxy({}, blockProxyHandler);
    block.md = paragraphMarkdown;
    block.url = matches[2];
    block.contents = paragraphContents;
    if (mainDisplayMarkdown) block.mainDisplayMarkdown = mainDisplayMarkdown;
    blocks.push(block);
  }

  return blocks.map((proxy) => JSON.parse(JSON.stringify(proxy)));
};

export const makeNewFrontmatterBlock = (md) => {
  const frontMatter = loadFront(md);
  const block = makeFrontMatterBlock(frontMatter);
  block.md = md;
  return JSON.parse(JSON.stringify(block));
};

export const makeNarrativeBlock = (md) => {
  const block = new Proxy({}, blockProxyHandler);
  // assumption -- first line is H1 element
  const lines = md.split(/\n+/);
  const matches = lines[0].match(/\[(.+?)\]\((\S+)\)/);
  lines[0] = `# ${matches[1]}\n`; // replace markdown URL with plain text
  block.url = matches[2];
  block.md = md;
  block.contents = lines.join("\n"); // proxy uses marked internally
  return JSON.parse(JSON.stringify(block));
};
