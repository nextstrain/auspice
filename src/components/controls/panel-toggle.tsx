// A slider toggle to adjust the state of a panel via dispatch.

import React from "react";
import { useAppDispatch } from "../../hooks";

import Toggle from "./toggle";
import { togglePanelDisplay } from "../../actions/panelDisplay";

type Props = {
  panel: string
  on: boolean
}

const PanelToggle = ({ panel, on }: Props) => {
  const dispatch = useAppDispatch();

  // There is no slider label since the title in the annotated header acts as a
  // visual label.
  // FIXME: Add a hidden label?

  return (
    <Toggle
      display={true}
      on={on}
      callback={() => dispatch(togglePanelDisplay(panel))}
      label=""
    />
  );
};

export default PanelToggle;
