import React from "react";
import { infoPanelStyles } from "../../globalStyles";
import { InfoLine } from "../tree/infoPanels/hover";
import HoverPanel from "../hoverPanel/hoverPanel";

export interface HoverData {
  hoverTitle: string
  mouseX: number
  mouseY: number
  containerId: string
  data: Map<string, unknown>
}

const MeasurementsHoverPanel = ({
  hoverData
}: {
  hoverData: HoverData
}): JSX.Element => {
  if (hoverData === null) return null;
  const { hoverTitle, mouseX, mouseY, containerId, data } = hoverData;

  return (
    <HoverPanel mouseX={mouseX} mouseY={mouseY} containerId={containerId}>
      <div style={infoPanelStyles.tooltipHeading}>
        {hoverTitle}
      </div>
      {[...data.entries()].map(([field, value]) => {
        return (
          <InfoLine key={field} name={`${field}:`} value={value} />
        );
      })}
    </HoverPanel>
  );
};

export default MeasurementsHoverPanel;
