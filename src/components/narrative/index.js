/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import { narrativeWidth, controlsWidth } from "../../util/globals";

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
    // this.state = {focusIdx: 0};
  }
  render() {
    console.log(this.props.blocks);
    if (!this.props.loaded) {return null;}
    const width = controlsWidth + 40; /* controls sidebar has 20px L & R padding */

    return (
      <div className={"static narrative"} style={{maxWidth: width, minWidth: width}}>
        {this.props.blocks.map((b) => (
          <DisplayBlock key={b.url} block={b}/>
        ))}
      </div>
    );
  }
}
export default Narrative;
