/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import { narrativeWidth, controlsWidth, titleBarHeight } from "../../util/globals";

const DisplayBlock = (props) => {
  return (
    <div
      style={{
        margin: "0px",
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: "40px",
        paddingBottom: "40px"
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
    this.handleScroll = () => {
      console.log("scroll", this)
    };
    // this.state = {focusIdx: 0};
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
        {this.props.blocks.map((b) => (
          <DisplayBlock key={b.url} block={b}/>
        ))}
      </div>
    );
  }
}
export default Narrative;
