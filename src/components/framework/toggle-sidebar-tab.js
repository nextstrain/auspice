import React from "react";
import { controlsWidth, controlsPadding } from "../../util/globals";

const ToggleSidebarTab = ({open, handler}) => {

  const degrees = open ? 180 : 0;

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
        left: open ? controlsWidth + controlsPadding - 15 : 0,
        transition: "left .3s ease-out"
      }}
    >
      <svg
        style={{
          position: "relative",
          top: 20,
          left: 4,
          transform: `rotate(${degrees}deg)`,
          transition: "transform 0.3s ease-out"
        }}
        width="7px"
        height="10.5px"
        viewBox="369 160 10 15"
      >
        <polygon
          id="Triangle"
          stroke="none"
          fill="#FFFFFF"
          points="379 167.5 369 175 369 160"
        />
      </svg>
    </div>
  );
};

export default ToggleSidebarTab;
