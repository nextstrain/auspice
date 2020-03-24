import React from "react";

const SidebarChevron = ({navHeight, navWidth, display, onClick}) => {
  const chevronStyle = {
    position: "fixed",
    left: navWidth ? navWidth-12 : -12,
    visibility: display ? "visible" : "hidden",
    width: display ? 12 : 0,
    top: navHeight/2-8,
    backgroundColor: "inherit",
    boxShadow: "none",
    cursor: "pointer",
    borderRadius: "0px",
    fontSize: 12,
    color: "#444",
    textAlign: "center",
    verticalAlign: "middle"
  };

  return (
    <div style={chevronStyle} onClick={onClick}>
      <i className="fa fa-chevron-left" aria-hidden="true"/>
    </div>
  );
};

export default SidebarChevron;
