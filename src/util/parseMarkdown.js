import marked from "marked";
import dompurify from "dompurify";

dompurify.addHook("afterSanitizeAttributes", (node) => {
  // Set external links to open in a new tab
  if ('href' in node && location.hostname !== node.hostname) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noreferrer nofollow');
  }
  // Find nodes that contain images and add imageContainer class to update styling
  const nodeContainsImg = ([...node.childNodes].filter((child) => child.localName === 'img')).length > 0;
  if (nodeContainsImg) {
    // For special case of image links, set imageContainer on outer parent
    if (node.localName === 'a') {
      node.parentNode.className += ' imageContainer';
    } else {
      node.className += ' imageContainer';
    }
  }
});

const ALLOWED_TAGS = ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'del', 'ol', 'ul', 'li', 'a', 'img'];
ALLOWED_TAGS.push('#text', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'th', 'tr', 'td');

const ALLOWED_ATTR = ['href', 'src', 'width', 'height', 'alt'];

export const parseMarkdown = (mdString) => {
  const sanitizer = dompurify.sanitize;
  const sanitizerConfig = {ALLOWED_TAGS, ALLOWED_ATTR, KEEP_CONTENT: false, ALLOW_DATA_ATTR: false};
  const rawDescription = marked(mdString);
  const cleanDescription = sanitizer(rawDescription, sanitizerConfig);
  return cleanDescription;
};
