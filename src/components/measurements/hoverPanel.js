import React from "react";
import { infoPanelStyles } from "../../globalStyles";

const HoverPanel = ({hoverData}) => {
  if (hoverData === null) return null;
  const { elementId, containerId, data } = hoverData;
  const panelStyle = {
    position: "absolute",
    width: 200,
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
  const elementPosition = document.getElementById(elementId).getBoundingClientRect();
  const relativePosition = {
    top: elementPosition.top - containerPosition.top + container.scrollTop,
    left: elementPosition.left - containerPosition.left
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
        {[...data.entries()].map(([field, value]) => {
          return (
            <p key={field}>{field} : {value}</p>
          );
        })}
      </div>
    </div>
  );
};

export default HoverPanel;
