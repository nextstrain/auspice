import React from "react";
import { connect } from "react-redux";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { controlsWidth, charonAPIAddress } from "../../util/globals";
import { LinkedParagraph, NormalParagraph } from "./paragraphs";
import { warningNotification } from "../../actions/notifications";

@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      blocks: undefined
    };
  }
  render() {
    if (!this.props.loaded) {
      return null;
    }
    return (
      <div
        className={"static narrative"}
        style={{
          padding: "0px 20px 20px 20px"
        }}
      >
        {this.props.blocks.map((block, idx) => {
          if (block.type === "action") {
            return (
              <LinkedParagraph
                url={block.url}
                content={{__html: block.__html}} // eslint-disable-line no-underscore-dangle
                key={idx.toString()}
              />
            );
          }
          return (
            // eslint-disable-next-line react/no-danger
            <div dangerouslySetInnerHTML={block} key={idx.toString()}/>
          );
        })}
      </div>
    );
  }
}
export default Narrative;
