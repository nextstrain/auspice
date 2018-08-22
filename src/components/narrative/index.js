/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { debounce } from 'lodash';
import { changePage } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE, TOGGLE_NARRATIVE } from "../../actions/types";
import { sidebarColor } from "../../globalStyles";
import { narrativeNavBarHeight } from "../../util/globals";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const progressHeight = 25;

const blockPadding = {
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "10px",
  paddingBottom: "10px"
};
const linkStyles = { // would be better to get CSS specificity working
  color: "#5097BA",
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "Lato",
  fontWeight: "400",
  fontSize: "1.8em"
};

const Block = (props) => {
  return (
    <div
      id={`NarrativeBlock_${props.n}`}
      ref={props.inputRef}
      style={{
        ...blockPadding,
        flexBasis: `${props.heightPerc}%`,
        flexShrink: 0
      }}
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
    this.automaticScrollInProgress = false;
    this.disableScroll = () => {
      this.automaticScrollInProgress = true;
    };
    this.enableScroll = () => {
      this.automaticScrollInProgress = false;
    };
    this.canScroll = () => {
      return !this.automaticScrollInProgress;
    };
    this.exitNarrativeMode = () => {
      this.props.dispatch({type: TOGGLE_NARRATIVE, display: false});
    };
    this.debouncedScroll = debounce(() => {
      if (!this.canScroll()) return;
      /* note that only one block / paragraph can ever be within the thresholds at any one time */
      const blockYPositions = this.blockRefs.map((ref, idx) => ({y: ref.getBoundingClientRect().y, idx}));
      const focusZone = [narrativeNavBarHeight, narrativeNavBarHeight+this.props.height*0.8];
      let blockInFocusZone;
      let goToBlock = false;
      blockInFocusZone = blockYPositions
        .filter((b) => b.y >= focusZone[0] && b.y <= focusZone[1]);
      if (blockInFocusZone.length) {
        blockInFocusZone = blockInFocusZone[0];
        const threshold = this.props.height * 0.2;
        // console.log("Block in zone:", blockInFocusZone, blockYPositions[blockInFocusZone.idx], threshold);
        if (blockInFocusZone.y < threshold) {
          if (blockInFocusZone.idx !== this.props.currentInFocusBlockIdx) {
            goToBlock = blockInFocusZone.idx;
          }
        } else {
          if (blockInFocusZone.idx > this.props.currentInFocusBlockIdx) { // eslint-disable-line no-lonely-if
            goToBlock = blockInFocusZone.idx;
          } else {
            goToBlock = blockInFocusZone.idx-1;
          }
        }
      } else {
        if (blockYPositions[blockYPositions.length-1].y < focusZone[0]) {
          /* in the footer. don't scroll */
        }
        /* we're in the middle of a long paragraph. Check to see if it's not in focus */
        blockInFocusZone = blockYPositions.filter((b) => b.y < focusZone[0]).slice(-1)[0];
        if (blockInFocusZone.idx !== this.props.currentInFocusBlockIdx) {
          goToBlock = blockInFocusZone.idx;
        }
      }
      if (goToBlock) {
        this.scrollToBlock(goToBlock);
      }
    }, 100, {trailing: true});
  }
  scrollToBlock(blockIdx, {behavior="smooth", dispatch=true} = {}) {
    this.disableScroll();
    const absoluteBlockYPos = this.blockRefs[blockIdx].getBoundingClientRect().y - narrativeNavBarHeight - progressHeight;
    // console.log(`scrollBy to ${parseInt(absoluteBlockYPos, 10)} (block ${blockIdx})`);
    this.componentRef.scrollBy({top: absoluteBlockYPos, behavior});
    window.setTimeout(this.enableScroll, 1500);
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
  renderOpacityFade(top) {
    const style = {
      zIndex: 200,
      position: "absolute",
      backgroundImage: `linear-gradient(to ${top?"top":"bottom"}, transparent, ${sidebarColor})`,
      width: "100%",
      height: "30px"
    };
    if (top) style.top = narrativeNavBarHeight + progressHeight;
    else style.bottom = 0;
    return (
      <div id={`fade${top?"Top":"Bottom"}`} style={style}/>
    );
  }
  renderChevron(pointUp) {
    const dims = {w: 30, h: 30};
    const style = {
      zIndex: 200,
      position: "absolute",
      cursor: "pointer",
      left: `${this.props.width/2 - dims.w/2}px`
    };
    if (pointUp) style.top = narrativeNavBarHeight + progressHeight;
    else style.bottom = 0;
    const gotoIdx = pointUp ? this.props.currentInFocusBlockIdx-1 : this.props.currentInFocusBlockIdx+1;
    return (
      <div id={`hand${pointUp?"Up":"Down"}`} style={style} onClick={() => this.scrollToBlock(gotoIdx)}>
        <svg width={`${dims.w}px`} height={`${dims.h}px`} viewBox="0 0 448 512" transform={`${pointUp ? 'rotate(180)' : ''}`}>
          <path
            d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
            fill="black"
          />
        </svg>
      </div>
    );
  }
  renderProgress() {
    return (
      <div
        style={{
          height: `${progressHeight}px`,
          width: "100%",
          backgroundColor: "inherit",
          boxShadow: '0px -3px 3px -3px rgba(0, 0, 0, 0.2) inset',
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "center"
        }}
      >
        {this.props.blocks.map((b, i) => {
          const d = this.props.currentInFocusBlockIdx === i ? "14px" : "6px";
          return (<div
            key={b.__html.slice(0, 30)}
            style={{width: d, height: d, background: "#74a9cf", borderRadius: "50%", cursor: "pointer"}}
            onClick={() => this.scrollToBlock(i)}
          />);
        })}
      </div>
    );
  }
  render() {
    if (!this.props.loaded) {return null;}

    return (
      <div
        id="NarrativeContainer"
        style={{top: narrativeNavBarHeight}}
      >
        {this.renderProgress()}
        {this.renderOpacityFade(true)}
        {this.renderOpacityFade(false)}
        {this.props.currentInFocusBlockIdx !== 0 ? this.renderChevron(true) : null}
        {this.props.currentInFocusBlockIdx+1 !== this.props.blocks.length ? this.renderChevron(false) : null}
        <div
          id="BlockContainer"
          className={"narrative"}
          ref={(el) => {this.componentRef = el;}}
          onScroll={this.debouncedScroll}
          style={{
            height: `${this.props.height-progressHeight}px`,
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
              heightPerc={i === this.props.blocks.length-1 ? "75" : "85"}
            />
          ))}
          <div id="EndOfNarrative" style={{flexBasis: "50%", flexShrink: 0}}>
            <h3 style={{textAlign: "center"}}>
              END OF NARRATIVE
            </h3>
            <div style={{...linkStyles, textAlign: "center"}} onClick={() => this.scrollToBlock(0)}>
              Click here to Scroll back to top
            </div>
            <div style={{...linkStyles, textAlign: "center", marginTop: "10px"}} onClick={this.exitNarrativeMode}>
            Click here to Exit narrative mode
            </div>
          </div>
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
