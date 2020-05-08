import React from "react"; // eslint-disable-line import/no-extraneous-dependencies
import queryString from "query-string"; // eslint-disable-line import/no-extraneous-dependencies
import { connect } from "react-redux"; // eslint-disable-line import/no-extraneous-dependencies
import { changePage } from "../../../src/actions/navigation";
import { Container, Leader, Fineprint, Button } from "./styles";

/**
 * Given a loaded narrative (i.e. one which has redux state) we want to show a summary
 * of the different slides for editing and allow naviation between them.
 */

@connect((state) => {
  return {
    blocks: state.narrative.blocks,
    title: state.narrative.title,
    blockIdx: state.narrative.blockIdx
  };
})
class Summary extends React.Component {
  constructor(props) {
    super(props);
    this.jumpToSlide = this.jumpToSlide.bind(this);
  }
  jumpToSlide(n) {
    /* will not work for mainDisplayMarkdown yet */
    this.props.dispatch(changePage({
      changeDataset: false,
      query: queryString.parse(this.props.blocks[n].query),
      queryToDisplay: {n},
      push: true
    }));
  }
  choose() {
    return (
      this.props.blocks.map((block, idx) => (
        <Button key={block.__html} selected={idx === this.props.blockIdx} onClick={() => this.jumpToSlide(idx)}>{idx}</Button>
      ))
    );
  }
  render() {
    return (
      <Container>
        <Leader>Summary of currently loaded Narrative</Leader>
        {this.props.blocks ? (
          <>
            <Fineprint>
              <strong>{`Narrative Title: `}</strong>
              {this.props.title}
            </Fineprint>
            <Fineprint>
              Each narative page is represented by a square below.
              Click on each one to edit the content and view the result.
            </Fineprint>
            {this.choose()}
          </>
        ) : (
          <Fineprint>No narrative loaded</Fineprint>
        )}
      </Container>
    );
  }
}

export default Summary;

