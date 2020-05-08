import React from "react"; // eslint-disable-line import/no-extraneous-dependencies
import { connect } from "react-redux"; // eslint-disable-line import/no-extraneous-dependencies
import queryString from "query-string"; // eslint-disable-line import/no-extraneous-dependencies
import ReactEditor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markdown';
import { changePage } from "../../../src/actions/navigation";
import { makeNarrativeBlock, makeNewFrontmatterBlock } from "../actions/parseNarrative";
import { Container, Leader, Button } from "./styles";

@connect((state) => {
  return {
    editor: state.editor,
    blocks: state.narrative.blocks,
    blockIdx: state.narrative.blockIdx
  };
})
class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.updateReduxState = this.updateReduxState.bind(this);
    this.state = { code: "" };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.blocks) {
      this.setState({code: nextProps.blocks[nextProps.blockIdx].md});
    }
  }
  updateReduxState() {
    /* Double dispatch -- bugs ensue which is why we wrap the 2nd dispatch in a `setTimeout` */

    /* First we change the redux state of the narrative blocks. This is enough for the narrative to
    automatically update via a normal react lifecycle method. But any query changes (in the redux block)
    do not update the dataset */
    const blocks = [...this.props.blocks];
    if (this.props.blockIdx === 0) {
      blocks[0] = makeNewFrontmatterBlock(this.state.code);
    } else {
      blocks[this.props.blockIdx] = makeNarrativeBlock(this.state.code);
    }
    this.props.dispatch({type: "DEVELOPMENT_ONLY_REPLACE_NARRATIVE_BLOCKS", blocks});

    /* Then update the app (viz) state deriving from the query in the block,
    if the first line has changed as this is where the query is encoded */
    if (this.props.blockIdx === 0 || blocks[this.props.blockIdx].md.split(/\n/)[0] !== this.state.code.split(/n/)[0]) {
      window.setTimeout(
        () => {
          this.props.dispatch(changePage({
            changeDataset: false,
            query: queryString.parse(this.props.blocks[this.props.blockIdx].query),
            queryToDisplay: {n: this.props.blockIdx},
            push: true
          }));
        },
        100
      );
    }
  }
  render() {
    if (!this.props.blocks) return null;
    if (this.props.blockIdx+1===this.props.blocks.length) {
      return (
        <Container>
          <Leader>
            Currently you cannot edit the final slide
          </Leader>
        </Container>
      );
    }
    return (
      <Container>
        <Leader>
          {`👇 this is the markdown block behind narrative slide ${this.props.blockIdx}. You can edit it & press "update" to update the narrative.`}
        </Leader>
        <ReactEditor
          value={this.state.code}
          onValueChange={(code) => this.setState({ code })}
          padding={10}
          highlight={(code) => highlight(code, languages.markdown)}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            backgroundColor: "#EEEEEE"
          }}
        />
        <br/>
        <Button onClick={this.updateReduxState}>{`💥 update`}</Button>
      </Container>
    );
  }
}

export default Editor;

