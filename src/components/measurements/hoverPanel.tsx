import React, { CSSProperties } from "react";
import { infoPanelStyles } from "../../globalStyles";
import { InfoLine } from "../tree/infoPanels/hover";

export interface HoverData {
  hoverTitle: string
  mouseX: number
  mouseY: number
  containerId: string
  data: Map<string, unknown>
}

const HoverPanel = ({
  hoverData
}: {
  hoverData: HoverData
}) => {
  if (hoverData === null) return null;
  const { hoverTitle, mouseX, mouseY, containerId, data } = hoverData;
  const panelStyle: CSSProperties = {
    position: "absolute",
    minWidth: 200,
    padding: "5px",
    borderRadius: 10,
    zIndex: 1000,
    pointerEvents: "none",
    fontFamily: infoPanelStyles.panel.fontFamily,
    fontSize: 14,
    lineHeight: 1,
    fontWeight: infoPanelStyles.panel.fontWeight,
    color: infoPanelStyles.panel.color,
    backgroundColor: infoPanelStyles.panel.backgroundColor,
    wordWrap: "break-word",
    wordBreak: "break-word"
  };

  const offset = 5;

  // Find the relative position of the hovered element to the hover panel's container div
  const container = document.getElementById(containerId);
  const containerPosition = container.getBoundingClientRect();
  // Make the max width of the hover panel half the container width to fit the
  // minimum available space based on expectations of positioning below
  panelStyle.maxWidth = containerPosition.width * 0.5;
  const relativePosition = {
    top: mouseY - containerPosition.top + container.scrollTop,
    left: mouseX - containerPosition.left
  };

  // Position hover panel to the right of the element if hovered element
  // is in the left half of the container div and vice versa
  if (relativePosition.left < containerPosition.width * 0.5) {
    panelStyle.left = relativePosition.left + offset;
  } else {
    panelStyle.right = containerPosition.width - relativePosition.left + offset;
  }

  // Position hover panel below the element if the hovered element
  // is in the top half of the container div and vice versa
  if (relativePosition.top - container.scrollTop < containerPosition.height * 0.5) {
    panelStyle.top = relativePosition.top + offset;
  } else {
    panelStyle.bottom = containerPosition.height - relativePosition.top + offset;
  }

  return (
    <div style={panelStyle}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div style={infoPanelStyles.tooltipHeading}>
          {hoverTitle}
        </div>
        {[...data.entries()].map(([field, value]) => {
          return (
            <InfoLine key={field} name={`${field}:`} value={value} />
          );
        })}
      </div>
    </div>
  );
};

export default HoverPanel;
