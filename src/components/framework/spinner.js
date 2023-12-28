import React from "react";
import Card from "./card";
import nextstrainLogo from "./nextstrain-logo-143.png";

const Spinner = ({availableHeight=false}) => {
  if (!availableHeight) {
    availableHeight = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
  }
  const style = {
    marginTop: `${availableHeight / 2 - 100}px`
  };
  return (<img className={"spinner"} src={nextstrainLogo} alt="loading" style={style}/>);
};

export const PanelSpinner = ({height, width}) => {
  return (
    <Card>
      <div style={{ height, width }}>
        <Spinner availableHeight={height} />
      </div>
    </Card>
  );
};

export default Spinner;
