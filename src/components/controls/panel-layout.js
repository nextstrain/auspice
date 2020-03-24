import React from "react";
import { connect } from "react-redux";
import styled, {withTheme} from 'styled-components';
import { withTranslation } from "react-i18next";
import * as icons from "../framework/svg-icons";
import { CHANGE_PANEL_LAYOUT } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { SidebarButton } from "./styles";

const ButtonText = styled.span`
  margin: 5px;
  position: relative;
  top: -1px;
`;

const PanelsFullIcon = withTheme(icons.PanelsFull);
const PanelsGridIcon = withTheme(icons.PanelsGrid);

@connect((state) => {
  return {
    panelLayout: state.controls.panelLayout,
    canTogglePanelLayout: state.controls.canTogglePanelLayout
  };
})
class PanelLayouts extends React.Component {
  render() {
    const { t } = this.props;
    // const mapAndTree = this.props.panels !== undefined && this.props.panels.indexOf("map") !== -1 && this.props.panels.indexOf("tree") !== -1;
    if (!this.props.canTogglePanelLayout) {
      return null;
    }
    return (
      <div style={{marginTop: 0, marginBottom: 10}}>
        <PanelsFullIcon width={22} selected={this.props.panelLayout === "full"}/>
        <SidebarButton
          selected={this.props.panelLayout === "full"}
          onClick={() => {
            analyticsControlsEvent("change-layout-full");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "full" });
          }}
        >
          <ButtonText>{t("sidebar:full")}</ButtonText>
        </SidebarButton>

        <PanelsGridIcon width={22} selected={this.props.panelLayout === "grid"}/>
        <SidebarButton
          selected={this.props.panelLayout === "grid"}
          onClick={() => {
            analyticsControlsEvent("change-layout-grid");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "grid" });
          }}
        >
          <ButtonText>{t("sidebar:grid")}</ButtonText>
        </SidebarButton>

      </div>
    );
  }
}

const WithTranslation = withTranslation()(PanelLayouts);
export default WithTranslation;
