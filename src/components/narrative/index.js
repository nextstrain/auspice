/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { changePageQuery } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE } from "../../actions/types";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const DisplayBlock = (props) => {
  return (
    <div
      ref={props.inputRef}
      style={props.styles}
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
    const focus = parseInt(queryString.parse(window.location.search).n, 10) || 1;
    this.state = {
      focus, /* idx of block in focus (and url) */
      shouldBeInFocus: focus, /* used by timeouts */
      timeoutRef: undefined,
      lastScroll: undefined
    };
    this.changeFocus = () => {
      const idx = this.state.shouldBeInFocus;
      this.props.dispatch(changePageQuery({
        queryToUse: queryString.parse(this.props.blocks[idx].url),
        queryToDisplay: {n: idx},
        push: true
      }));
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
  }
  componentDidMount() {
    window.twttr.widgets.load();
    if (this.state.focus !== 1) {
      this.blockRefs[this.state.focus].scrollIntoView({behavior: "instant", block: "center", inline: "center"});
    }
  }
  render() {
    if (!this.props.loaded) {return null;}
    // const width = narrativeWidth + 40; /* controls sidebar has 20px L & R padding */
    const blockStyles = {
      paddingLeft: "20px",
      paddingRight: "20px",
      paddingTop: "10px",
      paddingBottom: "10px",
      minHeight: this.props.height * 0.33
    };

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
            key={`block${i}`}
            block={b}
            focus={i === this.state.focus}
            styles={blockStyles}
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
