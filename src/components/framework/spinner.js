import React from "react";

const nextstrainLogo = require("../../images/nextstrain-logo-small.png");

const Spinner = ({availableHeight=false}) => {
  if (!availableHeight) {
    availableHeight = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight; // eslint-disable-line
  }
  const style = {
    marginTop: `${availableHeight / 2 - 100}px`
  };
  return (<img className={"spinner"} src={nextstrainLogo} alt="loading" style={style}/>);
};

export default Spinner;
