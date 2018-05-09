import React from "react";
import { goColor } from "../../globalStyles";
import { controlsWidth } from "../../util/globals";

/*
sidebarOpen and !mobileDisplay: chevron inset in sidebar
!sidebarOpen and !mobileDisplay: tab with chevron in top left of display
sidebarOpen and mobileDisplay: green button with "close" icon
!sidebarOpen and mobileDisplay: green button with "sliders" icon
*/

const SidebarToggle = ({sidebarOpen, mobileDisplay, handler}) => {

  const containerStyle = {
    width: mobileDisplay ? 60 : 15,
    height: mobileDisplay ? 60 : 15,
    position: "absolute",
    top: mobileDisplay ? 15 : 0,
    left: mobileDisplay ? "auto" : sidebarOpen ? controlsWidth + 24 : 0,
    right: mobileDisplay ? 20 : "auto",
    zIndex: 9000,
    backgroundColor: mobileDisplay ? goColor : "#E1E1E1",
    boxShadow: mobileDisplay ? "2px 4px 10px 1px rgba(0, 0, 0, 0.15)" : "none",
    cursor: "pointer",
    padding: 0,
    transition: "top 0.3s ease-out, left 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out",
    borderRadius: mobileDisplay ? "45px" : sidebarOpen ? "0px 0px 0px 2px" : "0px 0px 2px 0px"
  };

  const iconStyle = {
    position: "absolute",
    width: 30,
    height: 30,
    top: "50%",
    left: "50%",
    lineHeight: "30px",
    textAlign: "center",
    transform: 'translate(-50%,-50%)',
    marginLeft: "auto",
    marginRight: "auto",
    verticalAlign: "middle",
    color: mobileDisplay ? "#FFFFFF" : "#444",
    fontSize: mobileDisplay ? 26 : 12
  };

  let iconClass = "fa fa-close";
  if (sidebarOpen && !mobileDisplay) {
    iconClass = "fa fa-chevron-left";
  } else if (!sidebarOpen && !mobileDisplay) {
    iconClass = "fa fa-chevron-right";
  } else if (sidebarOpen && mobileDisplay) {
    iconClass = "fa fa-close";
  } else if (!sidebarOpen && mobileDisplay) {
    iconClass = "fa fa-sliders";
  }

  return (
    <div style={containerStyle} onClick={handler}>
      <div style={iconStyle}><i className={iconClass} aria-hidden="true"/></div>
    </div>
  );
};

export default SidebarToggle;
