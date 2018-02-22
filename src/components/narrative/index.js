/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { titleBarHeight } from "../../util/globals";
import { changePageQuery } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE } from "../../actions/types";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const blockPadding = {
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "40px",
  paddingBottom: "40px"
};

const DisplayBlock = (props) => {
  return (
    <div
      ref={props.inputRef}
      style={{...blockPadding}}
      className={props.focus ? "focus" : ""}
      dangerouslySetInnerHTML={props.block}
    />
  );
};


@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focus: 0, /* idx of block in focus (and url) */
      shouldBeInFocus: 0, /* used by timeouts */
      timeoutRef: undefined,
      lastScroll: undefined
    };
    this.changeFocus = () => {
      const idx = this.state.shouldBeInFocus;
      const query = queryString.parse(this.props.blocks[idx].url);
      this.props.dispatch(changePageQuery({query, hideURL: true, push: true}));
      this.setState({focus: idx, timeoutRef: undefined});
    };
    this.handleScroll = () => {
      /* handle scroll only fires (expensive) dispatches when no scroll has been observed for 250ms */
      /* 1: clear any previous timeouts */
      if (this.state.timeoutRef) {
        clearTimeout(this.state.timeoutRef);
      }
      /* 2: calculate shouldBeInFocus index */
      const halfY = this.props.height / 2;
      let shouldBeInFocus;
      for (let i = 0; i < this.blockRefs.length; i++) {
        const bounds = this.blockRefs[i].getBoundingClientRect();
        if (bounds.y < halfY && (bounds.y + bounds.height) > halfY) {
          shouldBeInFocus = i;
          break;
        }
      }
      /* 2 set timeouts */
      if (shouldBeInFocus === this.state.focus) {
        return;
      }
      const timeoutRef = setTimeout(this.changeFocus, 250);
      this.setState({timeoutRef, shouldBeInFocus});
    };
    this.blockRefs = [];
    this.props.dispatch(changePageQuery({
      query: queryString.parse(this.props.blocks[0].url),
      hideURL: true
    }));
  }
  render() {
    if (!this.props.loaded) {return null;}
    // const width = narrativeWidth + 40; /* controls sidebar has 20px L & R padding */

    return (
      <div
        onScroll={this.handleScroll}
        className={"static narrative"}
        style={{
          height: "100%",
          overflowY: "scroll",
          padding: "0px 20px 20px 20px"
        }}
      >
        {this.props.blocks.map((b, i) => (
          <DisplayBlock
            inputRef={(el) => {this.blockRefs[i] = el;}}
            key={b.url}
            block={b}
            focus={i === this.state.focus}
          />
        ))}
        <div style={{height: this.props.height * 0.4}}/>
      </div>
    );
  }
  componentWillUnmount() {
    this.props.dispatch({
      type: CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE,
      query: queryString.parse(this.props.blocks[this.state.focus].url)
    });
  }
}
export default Narrative;
