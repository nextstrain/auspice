import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { FaUndo, FaPause, FaPlay } from "react-icons/fa";
import { changeDateFilter } from "../../actions/tree";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";
import Flex from "../framework/flex";
import { SidebarButton } from "./styles";

@connect((state) => {
  return {
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
    animationPlayPauseButton: state.controls.animationPlayPauseButton,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay
  };
})
class AnimationControls extends React.Component {

  getPlayPauseButton() {
    return (
      <SidebarButton
        onClick={() => {
          this.props.animationPlayPauseButton === "Play" ?
            this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Pause"}) :
            this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Play"});
        }}
      >
        <span>
          {this.props.animationPlayPauseButton === "Play" ? <FaPlay color="#888"/> : <FaPause color="#888"/>}
          {" " + this.props.t(this.props.animationPlayPauseButton === "Play" ? "Play" : "Pause")}
        </span>
      </SidebarButton>
    );
  }

  getResetButton() {
    return (
      <SidebarButton
        onClick={() => {
          this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Play"});
          this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax, quickdraw: false}));
        }}
      >
        <span>
          {<FaUndo color="#888"/>}
          {" " + this.props.t("Reset")}
        </span>
      </SidebarButton>
    );
  }

  render() {
    if (this.props.branchLengthsToDisplay === "divOnly") {
      return null;
    }
    return (
      <div style={{marginBottom: 0}}>
        <Flex justifyContent="space-between">
          {this.getPlayPauseButton()}
          {this.getResetButton()}
        </Flex>
      </div>
    );
  }
}

const WithTranslation = withTranslation()(AnimationControls);
export default WithTranslation;
