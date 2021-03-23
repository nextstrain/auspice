/* eslint-disable react/jsx-no-bind */
/* ^^^ We can get away with this because <ChooseLayout> doesn't rerender frequently, but fixes are welcome */

import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import styled, { withTheme } from 'styled-components';
import { withTranslation } from 'react-i18next';
import Select from "react-select/lib/Select";
import * as icons from "../framework/svg-icons";
import { controlsWidth } from "../../util/globals";
import { collectScatterVariables, getStartingScatterVariables } from "../../util/scatterplotHelpers";
import { CHANGE_LAYOUT } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { SidebarSubtitle, SidebarButton } from "./styles";
import Toggle from "./toggle";


const RectangularTreeIcon = withTheme(icons.RectangularTree);
const RadialTreeIcon = withTheme(icons.RadialTree);
const UnrootedTreeIcon = withTheme(icons.UnrootedTree);
const ClockIcon = withTheme(icons.Clock);
const ScatterIcon = withTheme(icons.Scatter);

export const RowContainer = styled.div`
  padding: 0px 5px 1px 5px;
`;

@connect((state) => {
  return {
    layout: state.controls.layout,
    scatterVariables: state.controls.scatterVariables,
    colorBy: state.controls.colorBy,
    distanceMeasure: state.controls.distanceMeasure,
    colorings: state.metadata.colorings,
    showTreeToo: state.controls.showTreeToo,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay
  };
})
class ChooseLayout extends React.Component {
  static propTypes = {
    layout: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired
  }
  constructor(props) {
    super(props);
    this.updateScatterplot = (scatterVariables) => {
      this.props.dispatch({
        type: CHANGE_LAYOUT,
        layout: "scatter",
        scatterVariables: {...this.props.scatterVariables, ...scatterVariables}
      });
    };
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
        layout: userSelectedLayout
      });
    }
  }

  selectScatterVariables() {
    const {options, selected} = collectScatterVariables(this.props.colorings, this.props.scatterVariables);
    const miscSelectProps = {options, clearable: false, searchable: false, multi: false, valueKey: "label"};

    return (
      <>
        <ScatterVariableContainer>
          <ScatterAxisName>x</ScatterAxisName>
          <ScatterSelectContainer>
            <Select
              {...miscSelectProps}
              value={selected.x}
              onChange={(value) => this.updateScatterplot({x: value.value})}
            />
          </ScatterSelectContainer>
        </ScatterVariableContainer>

        <ScatterVariableContainer>
          <ScatterAxisName>y</ScatterAxisName>
          <ScatterSelectContainer>
            <Select
              {...miscSelectProps}
              value={selected.y}
              onChange={(value) => this.updateScatterplot({y: value.value})}
            />
          </ScatterSelectContainer>
        </ScatterVariableContainer>
        <div style={{paddingTop: "2px"}}/>
        <ScatterVariableContainer>
          <Toggle
            display
            on={this.props.scatterVariables.showBranches}
            callback={() => this.updateScatterplot({showBranches: !this.props.scatterVariables.showBranches})}
            label={"Show branches"}
          />
        </ScatterVariableContainer>
      </>
    );
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
        { /* Show clock view only if both time and divergence are defined for the tree */ }
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
        { /* Scatterplot view -- when selected this shows x & y dropdown selectors */ }
        <RowContainer>
          <ScatterIcon width={25} selected={selected === "scatter"}/>
          <SidebarButton
            selected={selected === "scatter"}
            onClick={() => this.updateScatterplot(getStartingScatterVariables(this.props.colorings, this.props.distanceMeasure, this.props.colorBy))}
          >
            {t("sidebar:scatter")}
          </SidebarButton>
          {selected==="scatter" && this.selectScatterVariables()}
        </RowContainer>
      </div>
    );
  }
}

const WithTranslation = withTranslation()(ChooseLayout);
export default WithTranslation;


const ScatterVariableContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-content: stretch;
  flex-wrap: nowrap;
  height: 100%;
  order: 0;
  flex-grow: 0;
  flex-shrink: 1;
  flex-basis: auto;
  align-self: auto;
  padding: 0px 0px 2px 15px;
`;

const ScatterAxisName = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 18px;
  font-size: 14px;
  font-weight: 400;
  font-family: ${(props) => props.theme["font-family"]};
  color: ${(props) => props.theme.color};
`;

const ScatterSelectContainer = styled.div`
  width: ${controlsWidth-18}px;
  font-size: 12px;
`;
