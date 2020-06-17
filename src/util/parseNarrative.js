import { loadFront } from 'yaml-front-matter'; // TODO - check webpack bundling of this new library


export const parseMarkdownNarrativeFile = (fileContents) => {

  console.log("parsing markdown narrative file...");

  const frontMatter = loadFront(fileContents);
  // const mdContent = frontMatter.__content;

  if (Object.keys(frontMatter).length === 1) {
    const notMarkdownError = new Error();
    notMarkdownError.fileContents = fileContents;
    throw notMarkdownError;
  }

  // todo: parsing not yet implemented.

};
