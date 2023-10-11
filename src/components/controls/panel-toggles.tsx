import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from 'react-i18next';

import Toggle from "./toggle";
import { togglePanelDisplay } from "../../actions/panelDisplay";
import { RootState } from "../../store";

export default function PanelToggles() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const panelsAvailable = useSelector((state: RootState) => state.controls.panelsAvailable);
  const panelsToDisplay = useSelector((state: RootState) => state.controls.panelsToDisplay);
  const showTreeToo = useSelector((state: RootState) => state.controls.showTreeToo);

  const panels = panelsAvailable.slice();
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
