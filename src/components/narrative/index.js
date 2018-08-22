/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { debounce } from 'lodash';
import { changePage } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE, TOGGLE_NARRATIVE } from "../../actions/types";
import { getLogo } from "../framework/nav-bar";
import { datasetToText } from "./helpers";
import { tabSingle, darkGrey } from "../../globalStyles";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const headerHeight = 90;
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

export const SidebarTopRightButton = ({text, callback}) => (
  <button
    style={{
      ...tabSingle,
      backgroundColor: "inherit",
      zIndex: 100,
      position: "absolute",
      right: 0,
      top: -1,
      cursor: "pointer",
      color: darkGrey
    }}
    onClick={callback}
  >
    {text}
  </button>
);

// http://localhost:4000/local/narratives/test/zika?n=0

const Header = (props) => {
  const title = props.blocks[0].__html.match(/>(.+?)</)[1];
  const dataset = props.blocks[0].dataset; // update to per-block later
  const queryFormatted = datasetToText(queryString.parse(props.blocks[props.n].query));

  return (
    <div
      id="HeaderContainer"
      style={{
        height: `${headerHeight}px`,
        display: "flex",
        flexDirection: "row",
        fontSize: "14px",
        fontWeight: 100,
        boxShadow: '0px -3px 3px -3px rgba(0, 0, 0, 0.2) inset'
      }}
    >
      {getLogo()}
      <SidebarTopRightButton
        callback={props.exitNarrativeMode}
        text="exit narrative mode"
      />
      <div
        style={{
          flexGrow: 1,
          paddingRight: blockPadding.paddingRight,
          paddingTop: "23px",
          paddingLeft: "5px"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            top: "10px"
          }}
        >
          <div style={{whiteSpace: "nowrap", fontWeight: 600}}>
            {title}
          </div>
          <div style={{whiteSpace: "nowrap", fontStyle: "italic"}}>
            {`Dataset: ${dataset}`}
          </div>
          <div style={{whiteSpace: "nowrap", fontStyle: "italic"}}>
            {`Settings: ${queryFormatted}`}
          </div>
        </div>
      </div>
      <div
        id="Progress"
        style={{
          position: "absolute",
          left: 0,
          width: `${props.percProgress}%`,
          top: `${headerHeight-3}px`,
          height: "3px",
          backgroundColor: "#74a9cf"
        }}
      />
    </div>
  );
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
      const focusZone = [headerHeight, headerHeight+this.props.height*0.8];
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
    const absoluteBlockYPos = this.blockRefs[blockIdx].getBoundingClientRect().y - headerHeight;
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
  renderHand(pointUp) {
    const dims = {w: 30, h: 30};
    const style = {zIndex: 200, position: "absolute", cursor: "pointer"};
    style.left = `${this.props.width/2 - dims.w/2}px`;
    if (pointUp) style.top = headerHeight + 1;
    else style.bottom = 0;
    const gotoIdx = pointUp ? this.props.currentInFocusBlockIdx-1 : this.props.currentInFocusBlockIdx+1;
    return (
      <div id={`hand${pointUp?"Up":"Down"}`} onClick={() => this.scrollToBlock(gotoIdx)} style={style}>
        <svg width={`${dims.w}px`} height={`${dims.h}px`} viewBox="0 0 1536 1792" transform={pointUp ? '' : 'rotate(180)'}>
          <path d="M1280 1600C1280 1582.67 1273.67 1567.67 1261 1555C1248.33 1542.33 1233.33 1536 1216 1536C1198.67 1536 1183.67 1542.33 1171 1555C1158.33 1567.67 1152 1582.67 1152 1600C1152 1617.33 1158.33 1632.33 1171 1645C1183.67 1657.67 1198.67 1664 1216 1664C1233.33 1664 1248.33 1657.67 1261 1645C1273.67 1632.33 1280 1617.33 1280 1600ZM1408 836C1408 710 1352.33 647 1241 647C1223.67 647 1205 648.667 1185 652C1174.33 632 1156.83 616.167 1132.5 604.5C1108.17 592.833 1083.67 587 1059 587C1034.33 587 1011.33 593 990 605C956.667 569.667 917 552 871 552C854.333 552 835.833 555.333 815.5 562C795.167 568.667 779.333 577 768 587V256C768 221.333 755.333 191.333 730 166C704.667 140.667 674.667 128 640 128C606 128 576.167 141 550.5 167C524.833 193 512 222.667 512 256V832C498.667 832 482.5 827 463.5 817C444.5 807 426.167 796 408.5 784C390.833 772 368.167 761 340.5 751C312.833 741 284.667 736 256 736C211.333 736 178.833 750.833 158.5 780.5C138.167 810.167 128 848.667 128 896C128 912 174.333 942 267 986C296.333 1002 318 1014.33 332 1023C374.667 1049.67 423 1087 477 1135C531 1182.33 566.333 1216 583 1236C621 1282 640 1328.67 640 1376V1408H1280V1376C1280 1328 1290.67 1272.33 1312 1209C1333.33 1145.67 1354.67 1081.17 1376 1015.5C1397.33 949.833 1408 890 1408 836ZM1536 831C1536 919.667 1513 1027 1467 1153C1427.67 1262.33 1408 1336.67 1408 1376V1664C1408 1699.33 1395.5 1729.5 1370.5 1754.5C1345.5 1779.5 1315.33 1792 1280 1792H640C604.667 1792 574.5 1779.5 549.5 1754.5C524.5 1729.5 512 1699.33 512 1664V1376C512 1369.33 510.5 1362.17 507.5 1354.5C504.5 1346.83 499.833 1339 493.5 1331C487.167 1323 481.167 1315.5 475.5 1308.5C469.833 1301.5 462.333 1293.5 453 1284.5C443.667 1275.5 436.5 1268.67 431.5 1264C426.5 1259.33 419.333 1253 410 1245C400.667 1237 395 1232.33 393 1231C343.667 1187.67 300.667 1154.33 264 1131C250 1122.33 229.333 1111.33 202 1098C174.667 1084.67 150.667 1072.33 130 1061C109.333 1049.67 88.3333 1036.17 67 1020.5C45.6667 1004.83 29.1667 986.5 17.5 965.5C5.83333 944.5 0 921.333 0 896C0 812.667 22.3333 743.833 67 689.5C111.667 635.167 174.667 608 256 608C301.333 608 344 615.333 384 630V256C384 186.667 409.333 126.667 460 76C510.667 25.3333 570.333 0 639 0C709 0 769.333 25.1667 820 75.5C870.667 125.833 896 186 896 256V425C937.333 427.667 977 440 1015 462C1029 460 1043.33 459 1058 459C1125.33 459 1184.67 479 1236 519C1328.67 518.333 1401.83 546.667 1455.5 604C1509.17 661.333 1536 737 1536 831Z" fill="black"/>
          <path d="M1280 1600C1280 1582.67 1273.67 1567.67 1261 1555C1248.33 1542.33 1233.33 1536 1216 1536C1198.67 1536 1183.67 1542.33 1171 1555C1158.33 1567.67 1152 1582.67 1152 1600C1152 1617.33 1158.33 1632.33 1171 1645C1183.67 1657.67 1198.67 1664 1216 1664C1233.33 1664 1248.33 1657.67 1261 1645C1273.67 1632.33 1280 1617.33 1280 1600ZM1408 836C1408 710 1352.33 647 1241 647C1223.67 647 1205 648.667 1185 652C1174.33 632 1156.83 616.167 1132.5 604.5C1108.17 592.833 1083.67 587 1059 587C1034.33 587 1011.33 593 990 605C956.667 569.667 917 552 871 552C854.333 552 835.833 555.333 815.5 562C795.167 568.667 779.333 577 768 587V256C768 221.333 755.333 191.333 730 166C704.667 140.667 674.667 128 640 128C606 128 576.167 141 550.5 167C524.833 193 512 222.667 512 256V832C498.667 832 482.5 827 463.5 817C444.5 807 426.167 796 408.5 784C390.833 772 368.167 761 340.5 751C312.833 741 284.667 736 256 736C211.333 736 178.833 750.833 158.5 780.5C138.167 810.167 128 848.667 128 896C128 912 174.333 942 267 986C296.333 1002 318 1014.33 332 1023C374.667 1049.67 423 1087 477 1135C531 1182.33 566.333 1216 583 1236C621 1282 640 1328.67 640 1376V1408H1280V1376C1280 1328 1290.67 1272.33 1312 1209C1333.33 1145.67 1354.67 1081.17 1376 1015.5C1397.33 949.833 1408 890 1408 836Z" fill="white"/>
        </svg>
      </div>
    );
  }
  render() {
    if (!this.props.loaded) {return null;}

    return (
      <div id="NarrativeContainer">
        <Header
          query={this.props.blocks[this.props.currentInFocusBlockIdx].query}
          n={this.props.currentInFocusBlockIdx}
          blocks={this.props.blocks}
          exitNarrativeMode={this.exitNarrativeMode}
          percProgress={(this.props.currentInFocusBlockIdx+1)/this.props.blocks.length*100}
        />
        {this.props.currentInFocusBlockIdx !== 0 ? this.renderHand(true) : null}
        {this.props.currentInFocusBlockIdx+1 !== this.props.blocks.length ? this.renderHand(false) : null}
        <div
          id="BlockContainer"
          className={"narrative"}
          ref={(el) => {this.componentRef = el;}}
          onScroll={this.debouncedScroll}
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
