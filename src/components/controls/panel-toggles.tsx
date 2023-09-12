import React from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks";
import { useTranslation } from 'react-i18next';

import Toggle from "./toggle";
import { togglePanelDisplay } from "../../actions/panelDisplay";
import { RootState } from "../../store";

export default function PanelToggles() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const panelsAvailable = useSelector((state: RootState) => state.controls.panelsAvailable);
  const panelsToDisplay = useSelector((state: RootState) => state.controls.panelsToDisplay);
  const showTreeToo = useSelector((state: RootState) => state.controls.showTreeToo);

  const panels = panelsAvailable.slice();

  // Prevent the map from being toggled on when a second tree is visible.
  // It is hidden by logic elsewhere.
  if (showTreeToo && panels.indexOf("map") !== -1) {
    panels.splice(panels.indexOf("map"), 1);
  }

  return <>
    {panels.map((n) => (
      <Toggle
        key={n}
        display
        on={panelsToDisplay.indexOf(n) !== -1}
        callback={() => dispatch(togglePanelDisplay(n))}
        label={t("sidebar:Show " + n)}
        style={{ paddingBottom: "10px" }}
      />
    ))}
  </>
}
