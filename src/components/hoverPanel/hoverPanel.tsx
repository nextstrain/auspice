import React, { CSSProperties, ReactNode } from "react";
import { infoPanelStyles } from "../../globalStyles";

interface HoverPanelProps {
  /** clientX of the cursor (viewport coordinates) */
  mouseX: number
  /** clientY of the cursor (viewport coordinates) */
  mouseY: number
  /** id of the (position: relative) container the panel is positioned within */
  containerId: string
  /** the panel's contents, e.g. a heading and one or more <InfoLine>s */
  children: ReactNode
}

/**
 * A generic hover panel (tooltip) which positions itself next to the cursor,
 * within the bounds of the container identified by `containerId`. It renders
 * `children` inside the shared tooltip styling; callers are responsible for the
 * contents (heading, info lines, etc.).
 */
const HoverPanel = ({
  mouseX,
  mouseY,
  containerId,
  children
}: HoverPanelProps): JSX.Element => {
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
        {children}
      </div>
    </div>
  );
};

export default HoverPanel;
