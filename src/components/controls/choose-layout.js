/* eslint-disable react/jsx-no-bind */
/* ^^^ We can get away with this because <ChooseLayout> doesn't rerender frequently, but fixes are welcome */

import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import styled, { withTheme } from 'styled-components';
import { withTranslation } from 'react-i18next';
import * as icons from "../framework/svg-icons";
import { CHANGE_LAYOUT } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { SidebarSubtitle, SidebarButton } from "./styles";

const RectangularTreeIcon = withTheme(icons.RectangularTree);
const RadialTreeIcon = withTheme(icons.RadialTree);
const UnrootedTreeIcon = withTheme(icons.UnrootedTree);
const ClockIcon = withTheme(icons.Clock);

export const RowContainer = styled.div`
  padding: 0px 5px 1px 5px;
`;

@connect((state) => {
  return {
    layout: state.controls.layout,
    showTreeToo: state.controls.showTreeToo,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay
  };
})
class ChooseLayout extends React.Component {
  static propTypes = {
    layout: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired
  }

  handleChangeLayoutClicked(userSelectedLayout) {
    const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference;
    if (!loopRunning) {
      if (userSelectedLayout === "rect") {
        analyticsControlsEvent("change-layout-rectangular");
      } else if (userSelectedLayout === "radial") {
        analyticsControlsEvent("change-layout-radial");
      } else if (userSelectedLayout === "unrooted") {
        analyticsControlsEvent("change-layout-unrooted");
      } else if (userSelectedLayout === "clock") {
        analyticsControlsEvent("change-layout-clock");
      } else {
        console.warn("Odd... controls/choose-layout.js tried to set a layout we don't offer...");
      }

      this.props.dispatch({
        type: CHANGE_LAYOUT,
        data: userSelectedLayout
      });
    }
  }

  render() {
    const { t } = this.props;
    if (this.props.showTreeToo) return null;
    const selected = this.props.layout;
    return (
      <div style={{marginBottom: 15}}>
        <SidebarSubtitle>
          {t("sidebar:Layout")}
        </SidebarSubtitle>
        <RowContainer>
          <RectangularTreeIcon width={25} selected={selected === "rect"}/>
          <SidebarButton
            selected={selected === "rect"}
            onClick={this.handleChangeLayoutClicked.bind(this, "rect")}
          >
            {t("sidebar:rectangular")}
          </SidebarButton>
        </RowContainer>
        <RowContainer>
          <RadialTreeIcon width={25} selected={selected === "radial"}/>
          <SidebarButton
            selected={selected === "radial"}
            onClick={this.handleChangeLayoutClicked.bind(this, "radial")}
          >
            {t("sidebar:radial")}
          </SidebarButton>
        </RowContainer>
        <RowContainer>
          <UnrootedTreeIcon width={25} selected={selected === "unrooted"}/>
          <SidebarButton
            selected={selected === "unrooted"}
            onClick={this.handleChangeLayoutClicked.bind(this, "unrooted")}
          >
            {t("sidebar:unrooted")}
          </SidebarButton>
        </RowContainer>
        {
          this.props.branchLengthsToDisplay === "divAndDate" ?
            (
              <RowContainer>
                <ClockIcon width={25} selected={selected === "clock"}/>
                <SidebarButton
                  selected={selected === "clock"}
                  onClick={this.handleChangeLayoutClicked.bind(this, "clock")}
                >
                  {t("sidebar:clock")}
                </SidebarButton>
              </RowContainer>
            ) :
            null
        }
      </div>
    );
  }
}

const WithTranslation = withTranslation()(ChooseLayout);
export default WithTranslation;
