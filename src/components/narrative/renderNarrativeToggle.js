import React from "react";
import { TOGGLE_NARRATIVE } from "../../actions/types";
import { tabSingle, darkGrey } from "../../globalStyles";


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
      onClick={() => dispatch({type: TOGGLE_NARRATIVE, narrativeOn: !narrativeIsDisplayed})}
    >
      {narrativeIsDisplayed ? "explore the data yourself" : "return to the narrative"}
    </button>
  );
};
