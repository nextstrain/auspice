import React from "react";
import Toggle from "./toggle";

/** Indicates panel visibility. */
export type On = boolean;

type Props = {
  on: On

  /** Function to invoke upon change in toggle state. */
  callback: () => void
}

/**
 * A slider toggle to adjust panel visibility via dispatch.
 */
export const PanelToggle = ({ on, callback }: Props) => {
  // There is no slider label since the title in the annotated header acts as a
  // visual label.
  // FIXME: Add a hidden label?

  return (
    <Toggle
      display={true}
      on={on}
      callback={callback}
      label=""
      style={{ height: "21px" }} // height from ToggleBackground. FIXME: this should be hardcoded in Toggle
    />
  );
};
