import React from "react";
import { connect } from "react-redux";
import { withTranslation, WithTranslation as WithTranslationProps } from "react-i18next";
import { toggleTemporalConfidence, changeDistanceMeasure } from "../../actions/tree";
import { SidebarSubtitle, SidebarButton } from "./styles";
import Toggle from "./toggle";
import { RootState, AppDispatch } from "../../store";

const mapStateToProps = (state: RootState): {
  distanceMeasure: RootState["controls"]["distanceMeasure"];
  layout: RootState["controls"]["layout"];
  showTreeToo: RootState["controls"]["showTreeToo"];
  branchLengthsToDisplay: RootState["controls"]["branchLengthsToDisplay"];
  streamTreesToggledOn: RootState["controls"]["showStreamTrees"];
  temporalConfidence: RootState["controls"]["temporalConfidence"];
} => ({
  distanceMeasure: state.controls.distanceMeasure,
  layout: state.controls.layout,
  showTreeToo: state.controls.showTreeToo,
  branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
  streamTreesToggledOn: state.controls.showStreamTrees,
  temporalConfidence: state.controls.temporalConfidence,
});

type ChooseMetricProps = ReturnType<typeof mapStateToProps> & WithTranslationProps & {
  dispatch: AppDispatch;
};

/* implements a pair of buttons that toggle between time & divergence tree layouts */
class ChooseMetric extends React.Component<ChooseMetricProps> {
  override render(): JSX.Element | null {
    const { t } = this.props;
    if (this.props.branchLengthsToDisplay !== "divAndDate") return null;
    if (this.props.layout==="scatter" || this.props.layout==="clock") return null;
    /* this used to be added to the first SidebarSubtitle
    const potentialOffset = this.props.showTreeToo ? {marginTop: "0px"} : {}; */

    const temporalConfidenceDisabled = this.props.streamTreesToggledOn;
    const temporalConfidenceLabel = temporalConfidenceDisabled ? t("sidebar:Confidence intervals disabled") : t("sidebar:Show confidence intervals")
    return (
      <div style={{marginBottom: 0}}>
        <SidebarSubtitle>
          {t("sidebar:Branch Length")}
        </SidebarSubtitle>

        <SidebarButton
          selected={this.props.distanceMeasure === "num_date"}
          onClick={(): void => {
            this.props.dispatch(changeDistanceMeasure("num_date"));
          }}
        >
          {t("sidebar:time")}
        </SidebarButton>
        <span style={{paddingRight: "12px"}}/>
        <SidebarButton
          selected={this.props.distanceMeasure === "div"}
          onClick={(): void => {
            this.props.dispatch(changeDistanceMeasure("div"));
          }}
        >
          {t("sidebar:divergence")}
        </SidebarButton>

        {this.props.showTreeToo ?
          null : (
            <div style={{marginBottom: 8}}>
              <Toggle
                display={this.props.temporalConfidence.display}
                on={this.props.temporalConfidence.on}
                disabled={temporalConfidenceDisabled}
                callback={(): void => {this.props.dispatch(toggleTemporalConfidence())}}
                label={temporalConfidenceLabel}
              />
            </div>
          )
        }
      </div>
    );
  }
}

const WithTranslation = withTranslation()(connect(mapStateToProps)(ChooseMetric));
export default WithTranslation;
