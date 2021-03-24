import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { CHANGE_DISTANCE_MEASURE } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { toggleTemporalConfidence } from "../../actions/tree";
import { SidebarSubtitle, SidebarButton } from "./styles";
import Toggle from "./toggle";

/* implements a pair of buttons that toggle between time & divergence tree layouts */
@connect((state) => {
  return {
    distanceMeasure: state.controls.distanceMeasure,
    layout: state.controls.layout,
    showTreeToo: state.controls.showTreeToo,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
    temporalConfidence: state.controls.temporalConfidence
  };
})
class ChooseMetric extends React.Component {
  render() {
    const { t } = this.props;
    if (this.props.branchLengthsToDisplay !== "divAndDate") return null;
    if (this.props.layout==="scatter" || this.props.layout==="clock") return null;
    /* this used to be added to the first SidebarSubtitle
    const potentialOffset = this.props.showTreeToo ? {marginTop: "0px"} : {}; */
    return (
      <div style={{marginBottom: 0}}>
        <SidebarSubtitle>
          {t("sidebar:Branch Length")}
        </SidebarSubtitle>

        <SidebarButton
          selected={this.props.distanceMeasure === "num_date"}
          onClick={() => {
            analyticsControlsEvent("tree-metric-temporal");
            this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "num_date" });
          }}
        >
          {t("sidebar:time")}
        </SidebarButton>
        <span style={{paddingRight: "12px"}}/>
        <SidebarButton
          selected={this.props.distanceMeasure === "div"}
          onClick={() => {
            analyticsControlsEvent("tree-metric-temporal");
            this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "div" });
          }}
        >
          {t("sidebar:divergence")}
        </SidebarButton>

        {this.props.showTreeToo ?
          null : (
            <div style={{margin: 5}}>
              <Toggle
                display={this.props.temporalConfidence.display}
                on={this.props.temporalConfidence.on}
                callback={() => this.props.dispatch(toggleTemporalConfidence())}
                label={t("sidebar:Show confidence intervals")}
              />
            </div>
          )
        }
      </div>
    );
  }
}

const WithTranslation = withTranslation()(ChooseMetric);
export default WithTranslation;
