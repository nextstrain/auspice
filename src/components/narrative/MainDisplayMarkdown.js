import React from "react";
import { connect } from "react-redux";
import marked from "marked";
import dompurify from "dompurify";
import { FooterStyles } from "../framework/footer";

const EXPERIMENTAL_MainDisplayMarkdown = ({narrativeBlock, width}) => {
  const cleanHTML = mdToHtml(narrativeBlock.mainDisplayMarkdown);
  return (
    <FooterStyles>
      <div style={{width: width-30, marginTop: 50}}>
        <div className='acknowledgments' dangerouslySetInnerHTML={{ __html: cleanHTML }}/>
      </div>
    </FooterStyles>
  );
};

export default connect((state) => ({
  narrativeBlock: state.narrative.blocks[state.narrative.blockIdx]
}))(EXPERIMENTAL_MainDisplayMarkdown);

function mdToHtml(md) {
  /* this is copy & pasted from `../framework/footer.js` and should be abstracted
  into a function */
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

  const sanitizer = dompurify.sanitize;
  const sanitizerConfig = {
    ALLOWED_TAGS: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'del', 'ol', 'ul', 'li', 'a', 'img', '#text', 'code', 'pre', 'hr'],
    ALLOWED_ATTR: ['href', 'src', 'width', 'height', 'alt'],
    KEEP_CONTENT: false,
    ALLOW_DATA_ATTR: false
  };
  const rawDescription = marked(md);
  const cleanDescription = sanitizer(rawDescription, sanitizerConfig);
  return cleanDescription;
}
