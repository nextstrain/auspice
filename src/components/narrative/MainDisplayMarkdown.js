import React, { Suspense, lazy } from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import { dataFont } from "../../globalStyles";

const MarkdownDisplay = lazy(() => import("../markdownDisplay"));

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

const MainDisplayMarkdown = ({ narrativeBlock, width, mobile }) => {
  return (
    <Container width={width} mobile={mobile}>
      <Suspense>
        <MarkdownDisplay dir="auto" mdstring={narrativeBlock.mainDisplayMarkdown} />
      </Suspense>
    </Container>
  );
};

export default connect((state) => ({
  narrativeBlock: state.narrative.blocks[state.narrative.blockIdx]
}))(MainDisplayMarkdown);
