import React from "react";
import { goColor } from "../../globalStyles";

const SidebarToggle = ({sidebarOpen, mobileDisplay, handler}) => {

  const containerStyle = {
    width: mobileDisplay ? 60 : 0,
    height: mobileDisplay ? 60 : 0,
    position: "absolute",
    right: 20,
    top: 15,
    zIndex: 9000,
    backgroundColor: goColor,
    boxShadow: "2px 4px 10px 1px rgba(0, 0, 0, 0.15)",
    cursor: "pointer",
    padding: 0,
    transition: "top 0.4s ease-out, left 0.4s ease-out, width 0.4s ease-out, height 0.4s ease-out",
    borderRadius: "45px"
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
    color: "#FFFFFF",
    fontSize: 26
  };

  return (
    <div style={containerStyle} onClick={handler}>
      {sidebarOpen ?
        <div style={iconStyle}><i className={"fa fa-times"} aria-hidden="true"/></div> :
        <div style={iconStyle}><i className={"fa fa-sliders"} aria-hidden="true"/></div>
      }
    </div>
  );
};

export default SidebarToggle;
