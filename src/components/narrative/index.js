/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { debounce } from 'lodash';
import { changePageQuery } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE } from "../../actions/types";
import { navBarHeightPx } from "../framework/nav-bar";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const Block = (props) => {
  return (
    <div
      id={`NarrativeBlock_${props.n}`}
      ref={props.inputRef}
      style={{
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: "10px",
        paddingBottom: "10px",
        flexBasis: "90%",
        flexShrink: 0
      }}
      className={props.focus ? "focus" : ""}
      dangerouslySetInnerHTML={props.block}
    />
  );
};

@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks,
  currentInFocusBlockIdx: state.narrative.blockIdx
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.componentRef = undefined;
    this.blockRefs = [];
    this.scrollInProgress = false;
    this.disableScroll = () => {
      console.log("DISABLE");
      this.scrollInProgress = true;
    };
    this.enableScroll = () => {
      console.log("ENABLE");
      this.scrollInProgress = false;
    };
    this.onContainerScroll = debounce(() => {
      if (this.scrollInProgress) return;

      /* watch for when we should scroll down */
      const nextBlockIdx = this.props.currentInFocusBlockIdx+1;
      if (this.blockRefs[nextBlockIdx]) {
        const nextBlockYPos = this.blockRefs[nextBlockIdx].getBoundingClientRect().y;
        const threshold = this.props.height * 0.8;
        console.log("onScroll (looking @ next block", this.props.currentInFocusBlockIdx+1, ")", nextBlockYPos, threshold)

        if (nextBlockYPos < threshold) {
          console.log("onScroll detected DOWN threshold crossed");
          this.scrollToBlock(this.props.currentInFocusBlockIdx+1);
          return;
        }
      }

      /* watch for when we should scroll back up to the previous block */
      if (this.props.currentInFocusBlockIdx !== 0) {
        const thisBlockYPos = this.blockRefs[this.props.currentInFocusBlockIdx].getBoundingClientRect().y;
        const threshold = this.props.height * 0.2;
        console.log("onScroll (scroll up?)", thisBlockYPos, threshold)
        if (thisBlockYPos > threshold) {
          console.log("onScroll detected UP threshold crossed");
          this.scrollToBlock(this.props.currentInFocusBlockIdx-1);
        }
      }
    }, 200, {trailing: true});
  }
  scrollToBlock(blockIdx, {behavior="smooth", dispatch=true} = {}) {
    // console.log("setting scrollByInProgress to true");
    this.disableScroll();

    const absoluteBlockYPos = this.blockRefs[blockIdx].getBoundingClientRect().y - navBarHeightPx;
    console.log(`scrollBy to ${absoluteBlockYPos} (block ${blockIdx})`);
    this.componentRef.scrollBy({top: absoluteBlockYPos, behavior});
    window.setTimeout(this.enableScroll, 1000);
    if (dispatch) {
      // console.log("Dispatching to change query to block #", blockIdx);
      // this.props.dispatch(changePageQuery({
      //   queryToUse: queryString.parse(this.props.blocks[blockIdx].query),
      //   queryToDisplay: blockIdx === 0 ? {} : {n: blockIdx},
      //   push: true
      // }));
      this.props.dispatch({type: "CHANGENBLOCKIDX", blockIdx})
    }
  }
  componentDidMount() {
    if (window.twttr && window.twttr.ready) {
      window.twttr.widgets.load();
    }
    /* if the query has defined a block to be shown (that's not the first)
    then we must scroll to that block */
    if (this.props.currentInFocusBlockIdx !== 0) {
      this.scrollToBlock(this.props.currentInFocusBlockIdx, {behavior: "instant", dispatch: false});
    }
    //   const componentHeight = this.componentRef.getBoundingClientRect().height;
    //   const yPos = this.blockRefs[this.props.currentInFocusBlockIdx].getBoundingClientRect().y - 0.5*componentHeight + 100;
    //   this.componentRef.scrollBy({top: yPos, left: 0, behavior: 'instant'});
    // }
    console.log(this.props.blocks)


  }
  render() {
    if (!this.props.loaded) {return null;}

    return (
      <div
        id="NarrativeContainer"
        ref={(el) => {this.componentRef = el;}}
        onScroll={this.onContainerScroll}
        className={"static narrative"}
        style={{
          height: `${this.props.height}px`,
          overflowY: "scroll",
          padding: "0px 0px 0px 0px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {this.props.blocks.map((b, i) => (
          <Block
            inputRef={(el) => {this.blockRefs[i] = el;}}
            key={b.__html.slice(0, 50)}
            block={b}
            n={i}
            focus={i === this.props.currentInFocusBlockIdx}
          />
        ))}
        <div style={{height: this.props.height * 0.4}}/>
      </div>
    );
  }
  componentWillUnmount() {
    this.props.dispatch({
      type: CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE,
      pathname: this.props.blocks[this.props.currentInFocusBlockIdx].dataset,
      query: queryString.parse(this.props.blocks[this.props.currentInFocusBlockIdx].url)
    });
  }
}
export default Narrative;
