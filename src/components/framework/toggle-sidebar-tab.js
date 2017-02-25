import React from "react";
import {brandColor} from "../../globalStyles";
import { titleBarHeight } from "../../util/globals";

const ToggleSidebarTab = ({open, handler}) => {

  const transform = open ? "translate(374.000000, 167.500000) rotate(180.000000) translate(-374.000000, -167.500000)" : "none";

  return (
    <div
      onClick={handler}
      style={{
        width: 15,
        height: 50,
        position: "fixed",
        top: 0,
        zIndex: 1001,
        backgroundColor: "#4b4e4e",
        cursor: "pointer",
        left: open ? "auto" : 0,
        right: open ? 0 : "auto"
      }}>
      <svg
        style={{
          position: "relative",
          top: 20,
          left: 4
        }}
        width="7px"
        height="10.5px"
        viewBox="369 160 10 15">
        <polygon
          id="Triangle"
          stroke="none"
          fill="#FFFFFF"
          transform={transform}
          points="379 167.5 369 175 369 160">
        </polygon>
      </svg>
    </div>
  );
};

export default ToggleSidebarTab;
