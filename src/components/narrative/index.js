/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import { narrativeWidth, controlsWidth, titleBarHeight } from "../../util/globals";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const DisplayBlock = (props) => {
  return (
    <div
      ref={props.inputRef}
      style={{
        margin: "0px",
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: "40px",
        paddingBottom: "40px",
        backgroundColor: props.focus ? "red" : "none"
      }}
      dangerouslySetInnerHTML={props.block}
    />
  );
};


@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks,
  browserHeight: state.browserDimensions.browserDimensions.height
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.state = {focus: undefined};
    this.handleScroll = () => {
      const halfY = (this.props.browserHeight - titleBarHeight) / 2;
      for (let i = 0; i < this.blockRefs.length; i++) {
        const bounds = this.blockRefs[i].getBoundingClientRect();
        if (bounds.y < halfY && (bounds.y + bounds.height) > halfY) {
          if (this.state.focus !== i) {
            this.setState({focus: i});
          }
          break;
        }
      }
    };
    this.blockRefs = [];
  }
  render() {
    console.log(this.props.blocks);
    if (!this.props.loaded) {return null;}
    const width = controlsWidth + 40; /* controls sidebar has 20px L & R padding */

    return (
      <div
        onScroll={this.handleScroll}
        className={"static narrative"}
        style={{height: this.props.browserHeight - titleBarHeight, maxWidth: width, minWidth: width, overflowY: "scroll"}}
      >
        {this.props.blocks.map((b, i) => (
          <DisplayBlock
            inputRef={(el) => {this.blockRefs[i] = el;}}
            key={b.url}
            block={b}
            focus={i === this.state.focus}
          />
        ))}
      </div>
    );
  }
}
export default Narrative;
