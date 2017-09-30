import React from "react";
import { controlsWidth, controlsPadding } from "../../util/globals";

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
        color: "#fff",
        backgroundColor: open ? "inherit" : "#696E76",
        boxShadow: open ? "none" : "2px 2px 4px rgba(0, 0, 0, 0.15)", // from react-sidebar
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
