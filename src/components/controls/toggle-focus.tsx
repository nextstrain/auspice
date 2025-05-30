import React from "react";
import { useSelector } from "react-redux";
import { FaInfoCircle } from "react-icons/fa";
import Toggle from "./toggle";
import { SidebarIconContainer, StyledTooltip } from "./styles";
import { SET_FOCUS } from "../../actions/types";
import { RootState } from "../../store";
import { useAppDispatch } from "../../hooks";
import { useTranslation } from "react-i18next";


export function ToggleFocus(): JSX.Element {
  const focus = useSelector((state: RootState) => state.controls.focus);
  const layout = useSelector((state: RootState) => state.controls.layout);
  const streamTreesToggledOn = useSelector((state: RootState) => state.controls.showStreamTrees);
  const dispatch = useAppDispatch();
  const mobileDisplay = useSelector((state: RootState) => state.general.mobileDisplay);
  const { t } = useTranslation();

  // Focus functionality is only available to layouts that have the concept of a unitless y-axis
  const validLayouts = new Set(["rect", "radial"]);
  if (!validLayouts.has(layout) || streamTreesToggledOn) return <></>;

  const text = t("sidebar:Focus on selected");
  const label = (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: "5px" }}>{text}</span>
      {!mobileDisplay && (
        <>
          <SidebarIconContainer style={{ display: "inline-flex" }} data-tip data-for="toggle-focus">
            <FaInfoCircle />
          </SidebarIconContainer>
          <StyledTooltip place="bottom" type="dark" effect="solid" id="toggle-focus">
            When focusing on selected nodes, nodes that do not match the
            filter will occupy less vertical space on the tree. Only applicable to
            rectangular and radial layouts.
          </StyledTooltip>
        </>
      )}
    </div>
  );

  return (
    <Toggle
      display
      on={focus === "selected"}
      callback={(): void => {
        const valueAfterToggling = focus === "selected" ? null : "selected";

        dispatch({
          type: SET_FOCUS,
          focus: valueAfterToggling,
        });
      }}
      label={label}
      style={{ paddingBottom: "10px" }}
    />
  );
}
