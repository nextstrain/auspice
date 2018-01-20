import React from "react";
import { connect } from "react-redux";
import { narrativeWidth } from "../../util/globals";
import { Gutter } from "./gutter";
import { Focus } from "./focus";

// const padding = {top: 0, right: 20, bottom: 20, left: 20, between: 30};
const focusFraction = 0.5;

@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks,
  browserHeight: state.browserDimensions.browserDimensions.height
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.state = {focusIdx: 0};
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-bind.md#es6-classes
    this.gotoPreviousBlock = this.gotoPreviousBlock.bind(this);
    this.gotoNextBlock = this.gotoNextBlock.bind(this);
  }
  gotoPreviousBlock() {
    if (this.state.focusIdx === 0) {return;}
    this.setState({focusIdx: this.state.focusIdx - 1});
  }
  gotoNextBlock() {
    if (this.state.focusIdx === this.props.blocks.length - 1) {return;}
    this.setState({focusIdx: this.state.focusIdx + 1});
  }
  render() {
    if (!this.props.loaded) {return null;}
    const heights = {
      focus: this.props.browserHeight * focusFraction,
      gutter: this.props.browserHeight * (1 - focusFraction) / 2
    };
    const width = narrativeWidth;
    const numBlocks = this.props.blocks.length;
    const titles = [];
    const visibility = {previous: [], subsequent: []};
    for (let i = 0; i < numBlocks; i++) {
      titles[i] = `title_${i}`;
      visibility.previous[i] = this.state.focusIdx > i ? "visible" : "hidden";
      visibility.subsequent[i] = this.state.focusIdx < i ? "visible" : "hidden";
    }

    return (
      <div className={"static narrative"}>
        <Gutter
          height={heights.gutter}
          width={width}
          pos={"top"}
          callback={this.gotoPreviousBlock}
          visibility={visibility.previous}
          titles={titles}
        />
        <Focus
          height={heights.focus}
          width={width}
          title={titles[this.state.focusIdx]}
          content={this.props.blocks[this.state.focusIdx]}
        />
        <Gutter
          height={heights.gutter}
          width={width}
          pos={"bottom"}
          callback={this.gotoNextBlock}
          visibility={visibility.subsequent}
          titles={titles}
        />
      </div>
    );
  }
}
export default Narrative;
