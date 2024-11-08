import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { withTranslation } from 'react-i18next';
import Card from "../framework/card";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import Byline from "./byline";
import {datasetSummary} from "./datasetSummary";
import FiltersSummary from "./filtersSummary";
import { RootState } from "../../store";

const mapState = (state: RootState) => {
  // can we generalise the mapState function so the following is for free?
  if (!state.metadata.loaded) { // loaded is the discriminant property to narrow types
    throw new Error("Something's gone seriously wrong")
  }
  return {
    browserWidth: state.browserDimensions.browserDimensions.width,
    animationPlayPauseButton: state.controls.animationPlayPauseButton,
    metadata: state.metadata,
    nodes: state.tree.nodes,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
    visibility: state.tree.visibility
  }
}
const connector = connect(mapState)
type PropsFromRedux = ConnectedProps<typeof connector>

interface Props extends PropsFromRedux {
  t: any; // TODO XXX - look up how to type WithTranslation
  width: number;
}

/**
 * The <Info> panel is shown above data viz panels and conveys static and dynamic
 * information about the dataset, including
 * Title
 * Byline (maintainers, build link etc)
 * Dataset summary (dynamic)
 * Current Filters (dynamic)
 */
class Info extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  override render() {
    const { t } = this.props;
    if (!this.props.metadata || !this.props.nodes || !this.props.visibility) return null;
    const styles = computeStyles(this.props.width, this.props.browserWidth);
    const animating = this.props.animationPlayPauseButton === "Pause";
    const showExtended = !animating;
    return (
      <Card center infocard>
        <div style={styles.base}>

          <div style={styles.title}>
            {this.props.metadata.title}
          </div>

          <div style={styles.byline}>
            <Byline metadata={this.props.metadata}/>
          </div>

          <div style={styles.n}>
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

const WithTranslation = withTranslation()(connector(Info));
export default WithTranslation;
