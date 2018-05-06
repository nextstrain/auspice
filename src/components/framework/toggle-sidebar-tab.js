import React from "react";
import { controlsPadding } from "../../util/globals";
import { sidebarColor, darkGrey } from "../../globalStyles";

const ToggleSidebarTab = ({sidebarOpen, handler, widthWhenOpen, widthWhenShut}) => {

  const containerStyle = {
    width: sidebarOpen ? 0 : 45,
    height: sidebarOpen ? 0 : 45,
    position: "absolute",
    top: sidebarOpen ? 26 : 5,
    left: sidebarOpen ? widthWhenOpen + controlsPadding - 16 : widthWhenShut + 5,
    zIndex: 1001,
    color: darkGrey,
    backgroundColor: sidebarColor,
    boxShadow: "0px 0px 6px 2px rgba(0, 0, 0, 0.15)",
    cursor: "pointer",
    padding: 0,
    fontSize: 16,
    transition: "top 0.4s ease-out, left 0.4s ease-out, width 0.4s ease-out, height 0.4s ease-out",
    borderRadius: "45px"
  };

  const iconStyle = {
    position: "absolute",
    width: 30,
    height: 30,
    top: "50%",
    left: "55%",
    lineHeight: "30px",
    textAlign: "center",
    transform: 'translate(-50%,-50%)',
    marginLeft: "auto",
    marginRight: "auto",
    verticalAlign: "middle",
    color: darkGrey
  };

  return (
    <div
      onClick={handler}
      style={containerStyle}
    >
      {sidebarOpen ?
        <div style={iconStyle}><i className={"fa fa-chevron-left"} aria-hidden="true"/></div> :
        <div style={iconStyle}><i className={"fa fa-chevron-right"} aria-hidden="true"/></div>
      }
    </div>
  );
};

export default ToggleSidebarTab;
