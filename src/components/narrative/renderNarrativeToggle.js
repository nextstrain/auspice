import React from "react";
import { TOGGLE_NARRATIVE } from "../../actions/types";
import { tabSingle, darkGrey } from "../../globalStyles";
import { Trans } from "react-i18next";

export const renderNarrativeToggle = (dispatch, narrativeIsDisplayed) => {
  return (
    <button
      style={{
        ...tabSingle,
        fontSize: 14,
        backgroundColor: "inherit",
        zIndex: 100,
        position: "fixed",
        right: 5,
        top: -1,
        cursor: "pointer",
        color: darkGrey
      }}
      onClick={() => dispatch({type: TOGGLE_NARRATIVE, display: !narrativeIsDisplayed})}
    >
      <Trans>
        {narrativeIsDisplayed ? "explore_data" : "return_to_narrative"}
      </Trans>
    </button>
  );
};
