import React from "react";
import { useSelector } from "react-redux";
import { FaInfoCircle } from "react-icons/fa";
import Toggle from "./toggle";
import { SidebarIconContainer, StyledTooltip } from "./styles";
import { SET_ZOOM } from "../../actions/types";
import { RootState } from "../../store";
import { useAppDispatch } from "../../hooks";
import { useTranslation } from "react-i18next";


export function ToggleZoom(): JSX.Element {
  const zoom = useSelector((state: RootState) => state.controls.zoom);
  const layout = useSelector((state: RootState) => state.controls.layout);
  const dispatch = useAppDispatch();
  const mobileDisplay = useSelector((state: RootState) => state.general.mobileDisplay);
  const { t } = useTranslation();

  // Zoom functionality is only available to rectangular layout
  const validLayouts = new Set(["rect"]);
  const disabled = !validLayouts.has(layout);

  const text = disabled ? t("sidebar:Dynamic zoom unavailable") : t("sidebar:Dynamic zoom");
  const label = (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: "5px" }}>{text}</span>
      {!mobileDisplay && (
        <>
          <SidebarIconContainer style={{ display: "inline-flex" }} data-tip data-for="toggle-zoom">
            <FaInfoCircle />
          </SidebarIconContainer>
          <StyledTooltip place="bottom" type="dark" effect="solid" id="toggle-zoom">
            When dynamic zoom is enabled, the tree automatically adjusts its XY bounds
            to fill the page based on visible nodes. Date updates and filters will
            dynamically update the zoom level. Only applicable to rectangular layout.
          </StyledTooltip>
        </>
      )}
    </div>
  );

  return (
    <Toggle
      display
      on={zoom === "dynamic" && !disabled}
      disabled={disabled}
      callback={(): void => {
        const valueAfterToggling = zoom === "dynamic" ? null : "dynamic";

        dispatch({
          type: SET_ZOOM,
          zoom: valueAfterToggling,
        });
      }}
      label={label}
      style={{ marginBottom: 8 }}
    />
  );
}
