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
import { collectAvailableScatterVariables, validateScatterVariables} from "../../util/scatterplotHelpers";
import { CHANGE_LAYOUT } from "../../actions/types";
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
    this.updateLayout = (layout, modifiedScatterVariables=undefined) => {
      if (window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference) return;
      const scatterVariables = modifiedScatterVariables ?
        {...this.props.scatterVariables, ...modifiedScatterVariables} :
        this.props.scatterVariables;
      this.props.dispatch({type: CHANGE_LAYOUT, layout, scatterVariables});
    };
  }

  renderScatterplotAxesSelector() {
    const options = collectAvailableScatterVariables(this.props.colorings);
    const selectedX = options.filter((o) => o.value===this.props.scatterVariables.x)[0];
    const selectedY = options.filter((o) => o.value===this.props.scatterVariables.y)[0];
    const miscSelectProps = {options, clearable: false, searchable: false, multi: false, valueKey: "label"};

    return (
      <>
        <ScatterVariableContainer>
          <ScatterAxisName>x</ScatterAxisName>
          <ScatterSelectContainer>
            <Select
              {...miscSelectProps}
              value={selectedX}
              onChange={(value) => this.updateLayout("scatter", {x: value.value, xLabel: value.label})}
            />
          </ScatterSelectContainer>
        </ScatterVariableContainer>

        <ScatterVariableContainer>
          <ScatterAxisName>y</ScatterAxisName>
          <ScatterSelectContainer>
            <Select
              {...miscSelectProps}
              value={selectedY}
              onChange={(value) => this.updateLayout("scatter", {y: value.value, yLabel: value.label})}
            />
          </ScatterSelectContainer>
        </ScatterVariableContainer>
      </>
    );
  }

  renderScatterplotToggles() {
    return (
      <>
        <div style={{paddingTop: "2px"}}/>
        <ScatterVariableContainer>
          <Toggle
            display
            on={this.props.scatterVariables.showBranches}
            callback={() => this.updateLayout(this.props.layout, {showBranches: !this.props.scatterVariables.showBranches})}
            label={"Show branches"}
          />
        </ScatterVariableContainer>
        <div style={{paddingTop: "2px"}}/>
        <ScatterVariableContainer>
          <Toggle
            display
            on={this.props.scatterVariables.showRegression}
            callback={() => this.updateLayout(this.props.layout, {showRegression: !this.props.scatterVariables.showRegression})}
            label={"Show regression"}
          />
        </ScatterVariableContainer>
        <div style={{paddingTop: "2px"}}/>
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
            onClick={() => this.updateLayout("rect")}
          >
            {t("sidebar:rectangular")}
          </SidebarButton>
        </RowContainer>
        <RowContainer>
          <RadialTreeIcon width={25} selected={selected === "radial"}/>
          <SidebarButton
            selected={selected === "radial"}
            onClick={() => this.updateLayout("radial")}
          >
            {t("sidebar:radial")}
          </SidebarButton>
        </RowContainer>
        <RowContainer>
          <UnrootedTreeIcon width={25} selected={selected === "unrooted"}/>
          <SidebarButton
            selected={selected === "unrooted"}
            onClick={() => this.updateLayout("unrooted")}
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
                  onClick={() => this.updateLayout(
                    "clock",
                    validateScatterVariables(this.props.scatterVariables, this.props.colorings, this.props.distanceMeasure, this.props.colorBy, true)
                  )}
                >
                  {t("sidebar:clock")}
                </SidebarButton>
                {selected==="clock" && this.renderScatterplotToggles()}
              </RowContainer>
            ) :
            null
        }
        { /* Scatterplot view -- when selected this shows x & y dropdown selectors etc */ }
        <RowContainer>
          <ScatterIcon width={25} selected={selected === "scatter"}/>
          <SidebarButton
            selected={selected === "scatter"}
            onClick={() => this.updateLayout(
              "scatter",
              validateScatterVariables(this.props.scatterVariables, this.props.colorings, this.props.distanceMeasure, this.props.colorBy, false)
            )}
          >
            {t("sidebar:scatter")}
          </SidebarButton>
          {selected==="scatter" && (
            <>
              {this.renderScatterplotAxesSelector()}
              {this.renderScatterplotToggles()}
            </>
          )}
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
