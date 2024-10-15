import React from "react";
import { connect } from "react-redux";
import { ImLab } from "react-icons/im";
import { FaInfoCircle } from "react-icons/fa";
import { Dispatch } from "@reduxjs/toolkit";
import Toggle from "./toggle";
import { SidebarIconContainer, StyledTooltip } from "./styles";
import { TOGGLE_FOCUS } from "../../actions/types";
import { RootState } from "../../store";


function ToggleFocus({ tooltip, focus, layout, dispatch, mobileDisplay }: {
  tooltip: React.ReactElement;
  focus: boolean;
  layout: "rect" | "radial" | "unrooted" | "clock" | "scatter";
  dispatch: Dispatch;
  mobileDisplay: boolean;
}) {
  // Focus functionality is only available to layouts that have the concept of a unitless y-axis
  const validLayouts = new Set(["rect", "radial"]);
  if (!validLayouts.has(layout)) return <></>;

  const label = (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span>Focus on Selected</span>
      <ImLab style={{ margin: "0 5px" }} />
      {tooltip && !mobileDisplay && (
        <>
          <SidebarIconContainer style={{ display: "inline-flex" }} data-tip data-for="toggle-focus">
            <FaInfoCircle />
          </SidebarIconContainer>
          <StyledTooltip place="bottom" type="dark" effect="solid" id="toggle-focus">
            {tooltip}
          </StyledTooltip>
        </>
      )}
    </div>
  );

  return (
    <Toggle
      display
      on={focus}
      callback={() => dispatch({ type: TOGGLE_FOCUS })}
      label={label}
      style={{ paddingBottom: "10px" }}
    />
  );
}

export default connect((state: RootState) => ({
  focus: state.controls.focus,
  layout: state.controls.layout,
  mobileDisplay: state.general.mobileDisplay,
}))(ToggleFocus);
