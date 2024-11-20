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
  left: 4px;
  top: -6px;
`;

const PanelsFullIcon = withTheme(icons.PanelsFull);
const PanelsGridIcon = withTheme(icons.PanelsGrid);

@connect((state) => {
  return {
    panelLayout: state.controls.panelLayout,
  };
})
class PanelLayouts extends React.Component {
  render() {
    const { t } = this.props;

    return (
      <div style={{marginTop: 0, marginBottom: 10}}>
        <SidebarButton
          selected={this.props.panelLayout === "full"}
          onClick={() => {
            analyticsControlsEvent("change-layout-full");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "full" });
          }}
        >
          <PanelsFullIcon width={22} selected={this.props.panelLayout === "full"}/>
          <ButtonText>{t("sidebar:full")}</ButtonText>
        </SidebarButton>

        <SidebarButton
          selected={this.props.panelLayout === "grid"}
          onClick={() => {
            analyticsControlsEvent("change-layout-grid");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "grid" });
          }}
        >
          <PanelsGridIcon width={22} selected={this.props.panelLayout === "grid"}/>
          <ButtonText>{t("sidebar:grid")}</ButtonText>
        </SidebarButton>
      </div>
    );
  }
}

const WithTranslation = withTranslation()(PanelLayouts);
export default WithTranslation;
