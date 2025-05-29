import React from "react";
import { connect } from "react-redux";
import { FaInfoCircle } from "react-icons/fa";
import Toggle from "./toggle";
import { SidebarIconContainer, StyledTooltip } from "./styles";
import { SET_FOCUS } from "../../actions/types";
import { Layout, Focus } from "../../reducers/controls";
import { AppDispatch, RootState } from "../../store";


function ToggleFocus({ tooltip, focus, layout, streamTreesToggledOn, dispatch, mobileDisplay,  }: {
  tooltip: React.ReactElement;
  focus: Focus;
  layout: Layout;
  streamTreesToggledOn: boolean;
  dispatch: AppDispatch;
  mobileDisplay: boolean;
}) {
  // Focus functionality is only available to layouts that have the concept of a unitless y-axis
  const validLayouts = new Set(["rect", "radial"]);
  if (!validLayouts.has(layout) || streamTreesToggledOn) return <></>;

  const label = (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: "5px" }}>Focus on selected</span>
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
      on={focus === "selected"}
      callback={() => {
        const valueAfterToggling = focus === "selected" ? null : "selected";

        return dispatch({
          type: SET_FOCUS,
          focus: valueAfterToggling,
        });
      }}
      label={label}
      style={{ paddingBottom: "10px" }}
    />
  );
}

export default connect((state: RootState) => ({
  focus: state.controls.focus,
  layout: state.controls.layout,
  mobileDisplay: state.general.mobileDisplay,
  streamTreesToggledOn: state.controls.showStreamTrees,
}))(ToggleFocus);
