import React from "react";
import { infoPanelStyles } from "../../globalStyles";

const InfoPanel = ({d3event, width, height, children}) => {
  /* this is a function - we can bail early */
  if (!d3event) {
    return null;
  }

  const styles = {
    container: {
      position: "absolute",
      maxWidth: 500,
      padding: "10px",
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
    }
  };

  const pos = {
    x: d3event.layerX,
    y: d3event.layerY
  };

  if (pos.x < width * 0.7) {
    styles.container.left = pos.x;
  } else {
    styles.container.right = width - pos.x;
  }
  if (pos.y < height * 0.5) {
    styles.container.top = pos.y;
  } else {
    styles.container.bottom = height - pos.y;
  }

  return (
    <div style={styles.container}>
      {children}
    </div>
  )
};

export default InfoPanel;
