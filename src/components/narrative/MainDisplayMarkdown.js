import React from "react";
import { connect } from "react-redux";
import marked from "marked";
import styled from 'styled-components';
import dompurify from "dompurify";
import { dataFont } from "../../globalStyles";


/**
 * The following code borrows heavily from the Footer
 * but is here in order to allow modifications with no side
 * effects to the Footer. This work was done in an expidited fashion
 * for nCoV but this should be revisted and improved when we have
 * time.                                          james. Jan 24 2020
 */

const Container = styled.div`
  margin: ${(props) => props.mobile ? `10px 5% 5% 5%` : `50px 30px 30px 30px`};
  font-family: ${dataFont};
  font-weight: 300;
  color: ${(props) => props.theme.unselectedColor};
  line-height: 1.4;
  width: ${(props) => props.width-30}px;

  /* Use media queries to modify the font size so things look ok
  on a range of screen sizes */
  font-size: 14px;
  line-height: 1.4;
  @media (max-width: 1080px) {
    line-height: 1.2;
  }

  h1 {
    font-weight: 700;
    font-size: 2em;
    margin: 0.3em 0;
  }

  h2 {
    font-weight: 600;
    font-size: 1.8em;
    margin: 0.3em 0;
  }

  h3 {
    font-weight: 500;
    font-size: 1.6em;
    margin: 0.3em 0;
  }

  h4 {
    font-weight: 500;
    font-size: 1.4em;
    margin: 0.2em 0;
  }

  h5 {
    font-weight: 500;
    font-size: 1.2em;
    margin: 0.2em 0;
  }

  h6 {
    font-weight: 500;
    font-size: 1.2em;
    margin: 0.2em 0;
  }

  pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 3px;
  }

  .line {
    margin-top: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid #CCC;
  }

  .imageContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  img {
    margin-left: 30px;
    margin-right: 30px;
    margin-top: 2px;
    margin-bottom: 2px;
  }

  table, th, td {
    border: 1px solid;
  }
  td, th {
    padding: 3px;
  }

`;

const EXPERIMENTAL_MainDisplayMarkdown = ({narrativeBlock, width, mobile}) => {
  const cleanHTML = mdToHtml(narrativeBlock.mainDisplayMarkdown);
  return (
    <Container width={width} mobile={mobile}>
      <div
        dir="auto"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: cleanHTML }}
      />
    </Container>
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
    ALLOWED_TAGS: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'del', 'ol', 'ul', 'li', 'a', 'img', '#text', 'pre', 'hr', 'table', 'thead', 'tbody', 'th', 'tr', 'td'],
    ALLOWED_ATTR: ['href', 'src', 'width', 'height', 'alt'],
    KEEP_CONTENT: false,
    ALLOW_DATA_ATTR: false
  };
  const rawDescription = marked(md);
  const cleanDescription = sanitizer(rawDescription, sanitizerConfig);
  return cleanDescription;
}
