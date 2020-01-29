import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { changePage, EXPERIMENTAL_showMainDisplayMarkdown } from "../../actions/navigation";
import { MobileBannerTop, MobileBannerBottom, MobileContentContainer } from "./styles";
import Tree from "../tree";
import Map from "../map/map";
import MainDisplayMarkdown from "./MainDisplayMarkdown";

/**
 * A React component which takes up the entire screen and displays narratives in
 * "mobile" format. Instead of each narrative page displayed as narrative-text in
 * the sidebar & viz on the right hand section of the page, as we do for laptops
 * we render both in a "scrolly" fashion. Banners at the top/bottom of the page
 * allow you to navigate between pages.
 *
 * TODO: a lot of code is duplicated between this and `narratives/index.js` +
 * `main/index.js`. These should be brought out into functions. Same with
 * styling.
 * TODO: entropy / frequencies panels
 */
@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks,
  currentInFocusBlockIdx: state.narrative.blockIdx,
  panelsToDisplay: state.controls.panelsToDisplay
}))
class MobileNarrativeDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showingEndOfNarrativePage: false
    };
    this.goToNextPage = () => {
      if (this.state.showingEndOfNarrativePage) return; // no-op
      if (this.props.currentInFocusBlockIdx+1 === this.props.blocks.length) {
        this.setState({showingEndOfNarrativePage: true});
        return;
      }
      this._goToPage(this.props.currentInFocusBlockIdx+1);
    };
    this.goToPreviousPage = () => {
      if (this.props.currentInFocusBlockIdx === 0) return; // no-op
      this._goToPage(this.props.currentInFocusBlockIdx-1);
    };
    this._goToPage = (idx) => {
      // TODO: this `if` statement should be moved to the `changePage` function or similar
      if (this.props.blocks[idx] && this.props.blocks[idx].mainDisplayMarkdown) {
        this.props.dispatch(EXPERIMENTAL_showMainDisplayMarkdown({
          query: queryString.parse(this.props.blocks[idx].query),
          queryToDisplay: {n: idx}
        }));
        return;
      }
      this.props.dispatch(changePage({
        changeDataset: false,
        query: queryString.parse(this.props.blocks[idx].query),
        queryToDisplay: {n: idx},
        push: true
      }));
    };
    // TODO: bind down & up arrows (is this ok since we also have scollable content?)
  }

  pageNarrativeContent() {
    if (this.props.blocks[this.props.currentInFocusBlockIdx].mainDisplayMarkdown) {
      /* don't display normal narrative content if the block defines `mainDisplayMarkdown` */
      return null;
    }
    const block = this.props.blocks[this.props.currentInFocusBlockIdx];
    return (
      <div
        id={`MobileNarrativeBlock_${this.props.currentInFocusBlockIdx}`}
        key={block.__html}
        style={{
          padding: "10px 20px",
          height: "inherit",
          overflow: "hidden"
        }}
        dangerouslySetInnerHTML={block}
      />
    );
  }
  renderMainMarkdown() {
    if (this.props.panelsToDisplay.includes("EXPERIMENTAL_MainDisplayMarkdown")) {
      return <MainDisplayMarkdown width={window.innerWidth}/>;
    }
    return null;
  }
  renderVizCards(height) {
    if (this.props.blocks[this.props.currentInFocusBlockIdx].mainDisplayMarkdown) {
      /* don't display normal narrative content if the block defines `mainDisplayMarkdown` */
      return null;
    }
    if (this.props.currentInFocusBlockIdx === 0) {
      /* don't display viz panels for intro page */
      return null;
    }
    const width = window.innerWidth - 50; // TODO
    return (
      <>
        {this.props.panelsToDisplay.includes("tree")
          ? <Tree width={width} height={height} /> : null}
        {this.props.panelsToDisplay.includes("map")
          ? <Map width={width} height={height} justGotNewDatasetRenderNewMap={false} /> : null}
      </>
    );
  }
  renderEndOfNarrative(bannerHeight, contentHeight) {  // todo add as class properties
    return (
      <>
        <MobileBannerTop height={bannerHeight} onClick={this.goToPreviousPage}>
          Previous
        </MobileBannerTop>
        <MobileContentContainer height={contentHeight+bannerHeight}>
          <h1>End</h1>
        </MobileContentContainer>
      </>
    );
  }

  renderStartOfNarrative(bannerHeight, contentHeight) {
    return (
      <>
        <MobileContentContainer height={contentHeight}>
          {this.pageNarrativeContent()}
          {this.renderVizCards(contentHeight)}
          {this.renderMainMarkdown()}
        </MobileContentContainer>
        <MobileBannerBottom height={bannerHeight} onClick={this.goToNextPage}>
          Next
        </MobileBannerBottom>
      </>
    );
  }

  render() {
    const bannerHeight = 50;
    const contentHeight = window.innerHeight - 2*bannerHeight;

    if (this.state.showingEndOfNarrativePage) {
      return this.renderEndOfNarrative(bannerHeight, contentHeight);

    } else if (this.props.currentInFocusBlockIdx === 0) {
      return this.renderStartOfNarrative(bannerHeight, contentHeight);
    }


    return (
      <>
        <MobileBannerTop height={bannerHeight} onClick={this.goToPreviousPage}>
          Previous
        </MobileBannerTop>
        <MobileContentContainer height={contentHeight}>
          {this.pageNarrativeContent()}
          {this.renderVizCards(contentHeight)}
          {this.renderMainMarkdown()}
        </MobileContentContainer>
        <MobileBannerBottom height={bannerHeight} onClick={this.goToNextPage}>
          Next
        </MobileBannerBottom>
      </>
    );
  }
}


export default MobileNarrativeDisplay;
