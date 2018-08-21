import React from "react";

const SidebarChevron = ({mobileDisplay, handler, extraStyles={}}) => {

  const chevronStyle = {
    visibility: mobileDisplay ? "hidden" : "visible",
    width: mobileDisplay ? 0 : 12,
    height: 16,
    backgroundColor: "inherit",
    boxShadow: "none",
    cursor: "pointer",
    marginTop: 2,
    borderRadius: "0px",
    fontSize: 12,
    color: "#444",
    textAlign: "center",
    verticalAlign: "middle"
  };

  return (
    <div style={{...chevronStyle, ...extraStyles}} onClick={handler}>
      <i className="fa fa-chevron-left" aria-hidden="true"/>
    </div>
  );
};

export default SidebarChevron;
