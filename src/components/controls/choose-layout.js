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
  render() {
    const { t } = this.props;
    if (this.props.showTreeToo) return null;
    const selected = this.props.layout;
    const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference;
    return (
      <div style={{marginBottom: 15}}>
        <SidebarSubtitle>
          {t("sidebar:Layout")}
        </SidebarSubtitle>
        <RowContainer>
          <RectangularTreeIcon width={25} selected={selected === "rect"}/>
          <SidebarButton
            selected={selected === "rect"}
            onClick={() => {if (!loopRunning) {analyticsControlsEvent("change-layout-rectangular"); this.props.dispatch({ type: CHANGE_LAYOUT, data: "rect" });}}}
          >
            {t("sidebar:rectangular")}
          </SidebarButton>
        </RowContainer>
        <RowContainer>
          <RadialTreeIcon width={25} selected={selected === "radial"}/>
          <SidebarButton
            selected={selected === "radial"}
            onClick={() => {if (!loopRunning) {analyticsControlsEvent("change-layout-radial"); this.props.dispatch({ type: CHANGE_LAYOUT, data: "radial" });}}}
          >
            {t("sidebar:radial")}
          </SidebarButton>
        </RowContainer>
        <RowContainer>
          <UnrootedTreeIcon width={25} selected={selected === "unrooted"}/>
          <SidebarButton
            selected={selected === "unrooted"}
            onClick={() => {if (!loopRunning) {analyticsControlsEvent("change-layout-unrooted"); this.props.dispatch({ type: CHANGE_LAYOUT, data: "unrooted" });}}}
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
                  onClick={() => {if (!loopRunning) {analyticsControlsEvent("change-layout-clock"); this.props.dispatch({ type: CHANGE_LAYOUT, data: "clock" });}}}
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
