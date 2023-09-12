import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from 'react-i18next';

import Toggle from "./toggle";
import { togglePanelDisplay } from "../../actions/panelDisplay";

// Interface to represent the entire Redux store.
// Since most of the codebase is not typed yet, add types manually¹ for now.
// TODO: Move this to src/store.
// ¹ https://react-redux.js.org/using-react-redux/usage-with-typescript#typing-hooks-manually
interface RootState {
  controls: {
    panelsAvailable: string[]
    panelsToDisplay: string[]
    showTreeToo: boolean

    // This allows arbitrary prop names while TypeScript adoption is incomplete.
    // TODO: add all other props explicitly and remove this.
    [propName: string]: any;
  }

  // This allows arbitrary prop names while TypeScript adoption is incomplete.
  // TODO: add all other props explicitly and remove this.
  [propName: string]: any;
}

export default function PanelToggles() {
  const dispatch = useDispatch();
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
