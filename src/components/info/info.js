import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import Card from "../framework/card";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import Byline from "./byline";
import {datasetSummary} from "./datasetSummary";
import FiltersSummary from "./filtersSummary";

/**
 * The <Info> panel is shown above data viz panels and conveys static and dynamic
 * information about the dataset, including
 * Title
 * Byline (maintainers, build link etc)
 * Dataset summary (dynamic)
 * Current Filters (dynamic)
 */
@connect((state) => {
  return {
    browserWidth: state.browserDimensions.browserDimensions.width,
    animationPlayPauseButton: state.controls.animationPlayPauseButton,
    metadata: state.metadata,
    nodes: state.tree.nodes,
    visibleStateCounts: state.tree.visibleStateCounts,
    filters: state.controls.filters,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
    visibility: state.tree.visibility
  };
})
class Info extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;
    if (!this.props.metadata || !this.props.nodes || !this.props.visibility) return null;
    const styles = computeStyles(this.props.width, this.props.browserWidth);
    const animating = this.props.animationPlayPauseButton === "Pause";
    const showExtended = !animating && !this.props.selectedStrain;
    return (
      <Card center infocard>
        <div style={styles.base}>

          <div width={this.props.width} style={styles.title}>
            {this.props.metadata.title || ""}
          </div>

          <div width={this.props.width} style={styles.byline}>
            <Byline/>
          </div>

          <div width={this.props.width} style={styles.n}>
            {animating ? t("Animation in progress") + ". " : null}
            {showExtended &&
              <>
                {datasetSummary({...this.props, mainTreeNumTips: this.props.metadata.mainTreeNumTips})}
                <FiltersSummary/>
              </>
            }
          </div>
        </div>
      </Card>
    );
  }
}

function computeStyles(width, browserWidth) {
  let fontSize = 28;
  if (browserWidth < 1000) fontSize = 27;
  if (browserWidth < 800) fontSize = 26;
  if (browserWidth < 600) fontSize = 25;
  if (browserWidth < 400) fontSize = 24;
  return {
    base: {
      width: width + 34,
      display: "inline-block",
      maxWidth: width,
      marginTop: 0
    },
    title: {
      fontFamily: titleFont,
      fontSize: fontSize,
      marginLeft: 0,
      marginTop: 0,
      marginBottom: 5,
      fontWeight: 500,
      color: darkGrey,
      letterSpacing: "-0.5px",
      lineHeight: 1.2
    },
    n: {
      fontFamily: headerFont,
      fontSize: 14,
      marginLeft: 2,
      marginTop: 5,
      marginBottom: 5,
      fontWeight: 500,
      color: medGrey,
      lineHeight: 1.4
    },
    byline: {
      fontFamily: headerFont,
      fontSize: 15,
      marginLeft: 2,
      marginTop: 5,
      marginBottom: 5,
      fontWeight: 500,
      color: "#555",
      lineHeight: 1.4,
      verticalAlign: "middle"
    }
  };
}

const WithTranslation = withTranslation()(Info);
export default WithTranslation;
