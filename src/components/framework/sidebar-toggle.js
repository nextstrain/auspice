import React from "react";
import { FaTimes, FaChevronRight, FaChevronLeft, FaSlidersH } from "react-icons/fa";
import { goColor, sidebarColor } from "../../globalStyles";

/*
sidebarOpen and !mobileDisplay: hide, SidebarChevron component visible instead
!sidebarOpen and !mobileDisplay: tab with chevron in top left of display
sidebarOpen and mobileDisplay: green button with "close" icon
!sidebarOpen and mobileDisplay: green button with "sliders" icon
*/

const SidebarToggle = ({sidebarOpen, mobileDisplay, handler}) => {

  const containerStyle = {
    visibility: mobileDisplay ? "visible" : sidebarOpen ? "hidden" : "visible",
    width: mobileDisplay ? 60 : 14,
    height: mobileDisplay ? 60 : 44,
    position: "absolute",
    top: mobileDisplay ? 15 : 4,
    left: mobileDisplay ? "auto" : 0,
    right: mobileDisplay ? 20 : "auto",
    zIndex: 9000,
    backgroundColor: mobileDisplay ? goColor : sidebarColor,
    boxShadow: mobileDisplay ? "2px 4px 10px 1px rgba(0, 0, 0, 0.15)" : "0px 0px 5px 1px rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
    padding: 0,
    transition: "top 0.3s ease-out, left 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out",
    borderRadius: mobileDisplay ? "45px" : "0px 6px 6px 0px"
  };

  const iconStyle = {
    visibility: mobileDisplay ? "visible" : sidebarOpen ? "hidden" : "visible",
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

  let icon = <FaTimes />;
  if (sidebarOpen && !mobileDisplay) {
    icon = <FaChevronLeft />;
  } else if (!sidebarOpen && !mobileDisplay) {
    icon = <FaChevronRight />;
  } else if (sidebarOpen && mobileDisplay) {
    icon = <FaTimes />;
  } else if (!sidebarOpen && mobileDisplay) {
    icon = <FaSlidersH />;
  }

  return (
    <div style={containerStyle} onClick={handler}>
      <div style={iconStyle}>{icon}</div>
    </div>
  );
};

export default SidebarToggle;
