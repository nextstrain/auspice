/* eslint no-console: off */
const marked = require('marked');
const yamlFront = require('yaml-front-matter');  /* https://www.npmjs.com/package/yaml-front-matter */
const fs = require('fs');
const path = require("path");
const fetch = require('node-fetch');
const sourceSelect = require("./sourceSelect");


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
      console.log("can't do arrays yet");
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
 * @param {array} fileContents string representing the entire markdown file
 * @param {bool} local is the markdown file sourced locally?
 * @return {obj}
 */
const markdownToBlocks = ({fileContents, local}) => {
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
    let paragraphContents = `## ${matches[1]}\n`; // the title text
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


const serveLocalNarrative = (res, filename) => {
  const pathName = path.join(global.LOCAL_NARRATIVES_PATH, filename);
  console.log("\ttrying to access & parse local narrative file: ", pathName);
  /* this code is syncronous, but that's ok since this is never used in production */
  const fileContents = fs.readFileSync(pathName, 'utf8');
  const blocks = markdownToBlocks({fileContents, local: true});
  res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
  console.log("\tSUCCESS");
};

const serveLiveNarrative = (res, filename, errorHandler) => {
  const fetchURL = global.REMOTE_NARRATIVES_BASEURL + "/" + filename;
  console.log("\ttrying to fetch & parse narrative file: ", fetchURL);
  fetch(fetchURL)
    .then((result) => result.text())
    .then((fileContents) => {
      const blocks = markdownToBlocks({fileContents, local: false});
      res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
      console.log("\tSUCCESS");
    })
    .catch(errorHandler);
};

const serveCommunityNarrative = (res, url, errorHandler) => {
  const urlParts = sourceSelect.splitUrlIntoParts(url);
  const orgName = urlParts[2];
  const repoName = urlParts[3];
  const filename = [repoName].concat(urlParts.slice(4)).join("_")+".md";
  const fetchURL = `https://rawgit.com/${orgName}/${repoName}/master/narratives/${filename}`;
  fetch(fetchURL)
    .then((result) => result.text())
    .then((fileContents) => {
      const blocks = markdownToBlocks({fileContents, local: false});
      res.send(JSON.stringify(blocks).replace(/</g, '\\u003c'));
      console.log("\tSUCCESS");
    })
    .catch(errorHandler);
};

const serveNarrative = (source, url, res) => {
  const filename = url
    .replace(/.+narratives\//, "")  // remove the URL up to (& including) "narratives/"
    .replace(/\/$/, "")             // remove ending slash
    .replace(/\//g, "_")            // change slashes to underscores
    .concat(".md");                 // add .md suffix

  const generalErrorHandler = (err) => {
    res.statusMessage = `Narratives couldn't be served -- ${err.message}`;
    console.warn(res.statusMessage);
    res.status(500).end();
  };

  try {
    if (source === "local") {
      try {
        serveLocalNarrative(res, filename);
      } catch (err) {
        generalErrorHandler(err);
      }
    } else if (source === "live") {
      serveLiveNarrative(res, filename, generalErrorHandler);
    } else if (source === "github") {
      serveCommunityNarrative(res, url, generalErrorHandler);
    } else {
      res.statusMessage = `Narratives cannot be sourced for "${source}" yet -- only "live" and "local" are supported.`;
      console.warn(res.statusMessage);
      res.status(500).end();
    }
  } catch (err) {
    generalErrorHandler(err);
  }
};

module.exports = {
  serveNarrative
};
