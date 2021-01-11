import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { CHANGE_ANIMATION_TIME, CHANGE_ANIMATION_CUMULATIVE, CHANGE_ANIMATION_LOOP } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import Toggle from "./toggle";
import { SidebarSubtitle, SidebarButton } from "./styles";

@connect((state) => {
  return {
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
    mapAnimationStartDate: state.controls.mapAnimationStartDate,
    mapAnimationDurationInMilliseconds: state.controls.mapAnimationDurationInMilliseconds,
    mapAnimationCumulative: state.controls.mapAnimationCumulative,
    mapAnimationShouldLoop: state.controls.mapAnimationShouldLoop
  };
})
class AnimationOptions extends React.Component {
  handleChangeAnimationTimeClicked(userSelectedDuration) {
    return () => {
      const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference;
      if (!loopRunning) {
        analyticsControlsEvent("change-animation-time");
        let duration;

        if (userSelectedDuration === "slow") {
          duration = 60000;
        } else if (userSelectedDuration === "medium") {
          duration = 30000;
        } else if (userSelectedDuration === "fast") {
          duration = 15000;
        } else {
          console.warn("Odd... controls/map-animation.js tried to set an animation speed we don't offer...");
        }

        /* cast string to num, the see if its an integer, ie., don't send the action if they type 'd' */
        this.props.dispatch({
          type: CHANGE_ANIMATION_TIME,
          data: duration /* this.checkAndTransformAnimationDuration(+e.target.value) */
        });
      }
    };
  }

  render() {
    const { t } = this.props;
    if (this.props.branchLengthsToDisplay === "divOnly") return null;

    return (
      <div id="mapAnimationControls">

        <SidebarSubtitle spaceAbove>
          {t("sidebar:Animation Speed")}
        </SidebarSubtitle>

        <SidebarButton
          selected={this.props.mapAnimationDurationInMilliseconds === 60000}
          onClick={this.handleChangeAnimationTimeClicked("slow")}
        >
          {t("sidebar:Slow")}
        </SidebarButton>
        <SidebarButton
          selected={this.props.mapAnimationDurationInMilliseconds === 30000}
          onClick={this.handleChangeAnimationTimeClicked("medium")}
        >
          {t("sidebar:Medium")}
        </SidebarButton>
        <SidebarButton
          selected={this.props.mapAnimationDurationInMilliseconds === 15000}
          onClick={this.handleChangeAnimationTimeClicked("fast")}
        >
          {t("sidebar:Fast")}
        </SidebarButton>

        <div style={{marginBottom: 5}}/>

        <Toggle
          display
          on={this.props.mapAnimationShouldLoop}
          callback={() => {
            this.props.dispatch({ type: CHANGE_ANIMATION_LOOP, data: !this.props.mapAnimationShouldLoop });
          }}
          label={t("sidebar:Loop animation")}
        />
        <br/>
        <Toggle
          display
          on={this.props.mapAnimationCumulative}
          callback={() => {
            analyticsControlsEvent("change-animation-cumulative");
            this.props.dispatch({ type: CHANGE_ANIMATION_CUMULATIVE, data: !this.props.mapAnimationCumulative });
          }}
          label={t("sidebar:Animate cumulative history")}
        />

      </div>
    );
  }
}

const WithTranslations = withTranslation()(AnimationOptions);
export default WithTranslations;
