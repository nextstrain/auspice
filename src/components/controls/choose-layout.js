import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import styled, { withTheme } from 'styled-components';
import { withTranslation } from 'react-i18next';
import * as icons from "../framework/svg-icons";
import { controlsWidth } from "../../util/globals";
import { collectAvailableScatterVariables} from "../../util/scatterplotHelpers";
import { SidebarSubtitle, SidebarButton } from "./styles";
import { changeLayout } from "../../actions/layout";
import Toggle from "./toggle";
import CustomSelect from "./customSelect";


const RectangularTreeIcon = withTheme(icons.RectangularTree);
const RadialTreeIcon = withTheme(icons.RadialTree);
const UnrootedTreeIcon = withTheme(icons.UnrootedTree);
const ClockIcon = withTheme(icons.Clock);
const ScatterIcon = withTheme(icons.Scatter);

export const RowContainer = styled.div`
  padding: 0px 5px 1px 5px;
`;

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
  padding: ${(props) => props.padAbove?"2":"0"}px 0px 2px 15px;
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

@connect((state) => {
  return {
    layout: state.controls.layout,
    scatterVariables: state.controls.scatterVariables,
    colorings: state.metadata.colorings,
    colorBy: state.controls.colorBy,
    showTreeToo: state.controls.showTreeToo,
    streamTreesToggledOn: state.controls.showStreamTrees,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay
  };
})
class ChooseLayout extends React.Component {
  static propTypes = {
    layout: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired
  }
  renderScatterplotAxesSelector() {
    const options = collectAvailableScatterVariables(this.props.colorings, this.props.colorBy);
    const selectedX = options.filter((o) => o.value===this.props.scatterVariables.x)[0];
    const selectedY = options.filter((o) => o.value===this.props.scatterVariables.y)[0];
    const miscSelectProps = {options, isClearable: false, isSearchable: false, isMulti: false};

    return (
      <>
        <ScatterVariableContainer>
          <ScatterAxisName>x</ScatterAxisName>
          <ScatterSelectContainer>
            <CustomSelect
              {...miscSelectProps}
              value={options.filter(({value}) => value === selectedX.value)}
              onChange={(value) => this.props.dispatch(changeLayout({x: value.value, xLabel: value.label}))}
            />
          </ScatterSelectContainer>
        </ScatterVariableContainer>

        <ScatterVariableContainer>
          <ScatterAxisName>y</ScatterAxisName>
          <ScatterSelectContainer>
            <CustomSelect
              {...miscSelectProps}
              value={options.filter(({value}) => value === selectedY.value)}
              onChange={(value) => this.props.dispatch(changeLayout({y: value.value, yLabel: value.label}))}
            />
          </ScatterSelectContainer>
        </ScatterVariableContainer>
      </>
    );
  }
  renderBranchToggle() {
    return (
      <ScatterVariableContainer padAbove>
        <Toggle
          display
          on={this.props.scatterVariables.showBranches}
          callback={() => this.props.dispatch(changeLayout({showBranches: !this.props.scatterVariables.showBranches}))}
          label={"Show branches"}
        />
      </ScatterVariableContainer>
    );
  }
  renderRegressionToggle() {
    if (this.props.layout === "scatter" && !(this.props.scatterVariables.xContinuous && this.props.scatterVariables.yContinuous)) {
      return null; // scatterplot regressions only available if _both_ variables are continuous
    }
    return (
      <ScatterVariableContainer padAbove>
        <Toggle
          display
          on={this.props.scatterVariables.showRegression}
          callback={() => this.props.dispatch(changeLayout({showRegression: !this.props.scatterVariables.showRegression}))}
          label={"Show regression"}
        />
      </ScatterVariableContainer>
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
          <div style={this.props.streamTreesToggledOn ? { opacity: 0.5 } : {}}>
            <RectangularTreeIcon width={25} selected={selected === "rect"}/>
            <SidebarButton
              selected={selected === "rect"}
              onClick={() => this.props.dispatch(changeLayout({layout: "rect"}))}
              disabled={this.props.streamTreesToggledOn}
            >
              {t("sidebar:rectangular")}
            </SidebarButton>
          </div>
        </RowContainer>
        <RowContainer>
          <div style={this.props.streamTreesToggledOn ? { opacity: 0.5 } : {}}>
            <RadialTreeIcon width={25} selected={selected === "radial"}/>
            <SidebarButton
              selected={selected === "radial"}
              onClick={() => this.props.dispatch(changeLayout({layout: "radial"}))}
              disabled={this.props.streamTreesToggledOn}
            >
              {t("sidebar:radial")}
            </SidebarButton>
          </div>
        </RowContainer>
        <RowContainer>
          <div style={this.props.streamTreesToggledOn ? { opacity: 0.5 } : {}}>
            <UnrootedTreeIcon width={25} selected={selected === "unrooted"}/>
            <SidebarButton
              selected={selected === "unrooted"}
              onClick={() => this.props.dispatch(changeLayout({layout: "unrooted"}))}
              disabled={this.props.streamTreesToggledOn}
            >
              {t("sidebar:unrooted")}
            </SidebarButton>
          </div>
        </RowContainer>
        { /* Show clock view only if both time and divergence are defined for the tree */ }
        {
          this.props.branchLengthsToDisplay === "divAndDate" ?
            (
              <RowContainer>
                <div style={this.props.streamTreesToggledOn ? { opacity: 0.5 } : {}}>
                  <ClockIcon width={25} selected={selected === "clock"}/>
                  <SidebarButton
                    selected={selected === "clock"}
                    onClick={() => this.props.dispatch(changeLayout({layout: "clock"}))}
                    disabled={this.props.streamTreesToggledOn}
                  >
                    {t("sidebar:clock")}
                  </SidebarButton>
                </div>
                {selected==="clock" && this.renderBranchToggle()}
                {selected==="clock" && this.renderRegressionToggle()}
              </RowContainer>
            ) :
            null
        }
        { /* Scatterplot view -- when selected this shows x & y dropdown selectors etc */ }
        <RowContainer>
          <div style={this.props.streamTreesToggledOn ? { opacity: 0.5 } : {}}>
            <ScatterIcon width={25} selected={selected === "scatter"}/>
            <SidebarButton
              selected={selected === "scatter"}
              onClick={() => this.props.dispatch(changeLayout({layout: "scatter"}))}
              disabled={this.props.streamTreesToggledOn}
            >
              {t("sidebar:scatter")}
            </SidebarButton>
          </div>
          {selected==="scatter" && this.renderScatterplotAxesSelector()}
          {selected==="scatter" && this.renderBranchToggle()}
          {selected==="scatter" && this.renderRegressionToggle()}
        </RowContainer>
      </div>
    );
  }
}

const WithTranslation = withTranslation()(ChooseLayout);
export default WithTranslation;
