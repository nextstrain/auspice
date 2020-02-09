import React from "react";
import { TOGGLE_NARRATIVE } from "../../actions/types";
import { tabSingle, darkGrey } from "../../globalStyles";
import locales from "../../locales.json";
import { getPreferredLanguage } from "../../util/preferredLanguage";

export const renderNarrativeToggle = (dispatch, narrativeIsDisplayed) => {
  const my_locale = locales[getPreferredLanguage()] || locales.en;
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
      {narrativeIsDisplayed ? my_locale.explore_data : my_locale.return_to_narrative}
    </button>
  );
};
