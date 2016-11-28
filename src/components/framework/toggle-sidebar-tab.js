import React from "react";

const ToggleSidebarTab = ({open, handler}) => {

  const transform = open ? "translate(374.000000, 167.500000) rotate(180.000000) translate(-374.000000, -167.500000)" : "none";

  return (
    <div
      onClick={handler}
      style={{
        width: 15,
        height: 55,
        position: "fixed",
        top: 5,
        zIndex: 1001,
        backgroundColor: "rgb(67, 119, 205)"
      }}>
      <svg
        style={{
          position: "relative",
          top: 17,
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
