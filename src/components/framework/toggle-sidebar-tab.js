import React from "react";
import { controlsWidth, controlsPadding } from "../../util/globals";
import { sidebarColor, darkGrey } from "../../globalStyles";

const ToggleSidebarTab = ({open, handler}) => {

  return (
    <div
      onClick={handler}
      style={{
        width: 13,
        height: 35,
        position: "fixed",
        top: 0,
        zIndex: 1001,
        color: darkGrey,
        backgroundColor: open ? "inherit" : sidebarColor,
        boxShadow: open ? "none" : "-2px -2px 4px -2px rgba(0, 0, 0, 0.15) inset", // from react-sidebar
        cursor: "pointer",
        paddingTop: 17,
        paddingLeft: open ? 1 : 4,
        left: open ? controlsWidth + controlsPadding - 19 : 0,
        transition: "left .3s ease-out",
        fontSize: 14
      }}
    >
      {open ? <i className="fa fa-chevron-left" aria-hidden="true"/>
        : <i className="fa fa-chevron-right" aria-hidden="true"/>
      }
    </div>
  );
};

export default ToggleSidebarTab;
