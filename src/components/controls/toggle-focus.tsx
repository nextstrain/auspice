import React from "react";
import { connect } from "react-redux";
import { FaInfoCircle } from "react-icons/fa";
import Toggle from "./toggle";
import { SidebarIconContainer, StyledTooltip } from "./styles";
import { TOGGLE_FOCUS } from "../../actions/types";
import { Layout } from "../../reducers/controls";
import { AppDispatch, RootState } from "../../store";


function ToggleFocus({ tooltip, focus, layout, dispatch, mobileDisplay }: {
  tooltip: React.ReactElement;
  focus: boolean;
  layout: Layout;
  dispatch: AppDispatch;
  mobileDisplay: boolean;
}) {
  // Focus functionality is only available to layouts that have the concept of a unitless y-axis
  const validLayouts = new Set(["rect", "radial"]);
  if (!validLayouts.has(layout)) return <></>;

  const label = (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: "5px" }}>Focus on Selected</span>
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
      isExperimental={true}
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
