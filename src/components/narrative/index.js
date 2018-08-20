/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { debounce } from 'lodash';
import { changePage } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE } from "../../actions/types";
import { getLogo } from "../framework/nav-bar";
import { datasetToText } from "./helpers";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const headerHeight = 85;
const progressHeight = 10;
const blockPadding = {
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "10px",
  paddingBottom: "10px"
};

const Header = (props) => {
  let inner;
  if (props.n !== 0) {
    const text = datasetToText(queryString.parse(props.query));
    inner = (
      <div style={{flexGrow: 1, color: "red", ...blockPadding}}>
        {text}
      </div>
    );
  } else {
    inner = (
      <div style={{flexGrow: 1, ...blockPadding}}>
        {"Introduction to header here?"}
      </div>
    );
  }
  return (
    <div
      id="Header"
      style={{
        height: `${headerHeight}px`,
        display: "flex",
        flexDirection: "row",
        fontSize: "14px",
        fontWeight: 100
      }}
    >
      {getLogo()}
      {inner}
    </div>
  );
};

const Progress = (props) => (
  <div
    id="Progress"
    style={{
      width: `${props.perc}%`,
      height: `${progressHeight-5}px`,
      backgroundColor: "#74a9cf",
      marginBottom: "5px"
    }}
  />
);


const Block = (props) => {
  return (
    <div
      id={`NarrativeBlock_${props.n}`}
      ref={props.inputRef}
      style={{
        ...blockPadding,
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
      this.scrollInProgress = true;
    };
    this.enableScroll = () => {
      this.scrollInProgress = false;
    };
    this.onContainerScroll = debounce(() => {
      if (this.scrollInProgress) return;

      /* watch for when we should scroll down */
      const nextBlockIdx = this.props.currentInFocusBlockIdx+1;
      if (this.blockRefs[nextBlockIdx]) {
        const nextBlockYPos = this.blockRefs[nextBlockIdx].getBoundingClientRect().y;
        const threshold = this.props.height * 0.8;
        // console.log("onScroll (looking @ next block", this.props.currentInFocusBlockIdx+1, ")", nextBlockYPos, threshold)

        if (nextBlockYPos < threshold) {
          // console.log("onScroll detected DOWN threshold crossed");
          this.scrollToBlock(this.props.currentInFocusBlockIdx+1);
          return;
        }
      }

      /* watch for when we should scroll back up to the previous block */
      if (this.props.currentInFocusBlockIdx !== 0) {
        const thisBlockYPos = this.blockRefs[this.props.currentInFocusBlockIdx].getBoundingClientRect().y;
        const threshold = this.props.height * 0.2;
        // console.log("onScroll (scroll up?)", thisBlockYPos, threshold)
        if (thisBlockYPos > threshold) {
          // console.log("onScroll detected UP threshold crossed");
          this.scrollToBlock(this.props.currentInFocusBlockIdx-1);
        }
      }
    }, 200, {trailing: true});
  }
  scrollToBlock(blockIdx, {behavior="smooth", dispatch=true} = {}) {
    this.disableScroll();

    const absoluteBlockYPos = this.blockRefs[blockIdx].getBoundingClientRect().y - headerHeight - progressHeight;
    console.log(`scrollBy to ${parseInt(absoluteBlockYPos, 10)} (block ${blockIdx})`);
    this.componentRef.scrollBy({top: absoluteBlockYPos, behavior});
    window.setTimeout(this.enableScroll, 1000);
    if (dispatch) {
      this.props.dispatch(changePage({
        // path: this.props.blocks[blockIdx].dataset, // not yet implemented properly
        dontChangeDataset: true,
        query: queryString.parse(this.props.blocks[blockIdx].query),
        queryToDisplay: {n: blockIdx},
        push: true
      }));
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
  }
  render() {
    if (!this.props.loaded) {return null;}

    return (
      <div id="NarrativeContainer">
        <Header
          query={this.props.blocks[this.props.currentInFocusBlockIdx].query}
          n={this.props.currentInFocusBlockIdx}
        />
        <Progress
          perc={(this.props.currentInFocusBlockIdx+1)/this.props.blocks.length*100}
        />
        <div
          id="BlockContainer"
          className={"static narrative"}
          ref={(el) => {this.componentRef = el;}}
          onScroll={this.onContainerScroll}
          style={{
            height: `${this.props.height-headerHeight}px`,
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
