import React from "react";
import { connect } from "react-redux";


const Chevron = ({pos, height, width, callback}) => {
  const top = pos === "top" ? height - 80 : 10;
  return (
    <span
      className={`chevron ${pos}`}
      style={{top: `${top}px`, left: "0px", minWidth: width, minHeight: "3em", position: "absolute", backgroundColor: "orange", cursor: "pointer"}}
      onClick={callback}
    />
  );
};

/* array of fontSizes and corresponding heights (px) */
const fsH = [[23, 28], [19, 24], [16, 20], [15, 18], [13, 16], [11, 14]];

/* fn to calculate the title sizes such that they are larger the closer they are to the
in-focus title, and then diminish in size as they gt further off.
If there is no remaining spaces, the titles are not displayed (fontsize & height = 0) */
const calculateFontSizeAndHeightOfTitles = (titles, divHeight, visibility, gutterPos) => {
  let spaceRemaining = 0.7 * divHeight;
  const ret = [];

  const makeFsH = (j) => {
    let [fs, h] = j >= fsH.length ? fsH[fsH.length - 1] : fsH[j];
    if (h > spaceRemaining) {
      [fs, h] = [0, 0];
    } else {
      spaceRemaining -= h;
    }
    return [fs, h];
  };

  let j = 0; /* the 0-based numbering of the visibil elements */
  if (gutterPos === "bottom") {
    for (let i = 0; i < visibility.length; i++) {
      const [fs, h] = visibility[i] === "hidden" ? [0, 0] : makeFsH(j);
      if (visibility[i] === "visible") {j++;}
      ret[i] = [fs, h + "px"];
    }
  } else {
    for (let i = visibility.length - 1; i >= 0; i--) {
      const [fs, h] = visibility[i] === "hidden" ? [0, 0] : makeFsH(j);
      if (visibility[i] === "visible") {j++;}
      ret[i] = [fs, h + "px"];
    }
  }
  return [ret, spaceRemaining];
};

@connect()
export class Gutter extends React.Component { // eslint-disable-line
  render() {
    const useableHeight = this.props.height - 2 * 20;
    const [vals, spaceRemaining] = calculateFontSizeAndHeightOfTitles(this.props.titles, useableHeight, this.props.visibility, this.props.pos);
    return (
      <div
        style={{
          minWidth: `${this.props.width}px`,
          minHeight: `${this.props.height}px`,
          maxHeight: `${this.props.height}px`,
          backgroundColor: "skyblue",
          position: "relative",
          padding: "20px",
          margin: "0px"
        }}
      >
        <Chevron pos={this.props.pos} height={this.props.height} width={this.props.width} callback={this.props.callback}/>
        {this.props.pos === "bottom" ? <div style={{minHeight: (0.2 * useableHeight + spaceRemaining) + "px"}}/> : null}
        {this.props.titles.map((t, i) => (
          <div key={t} style={{transition: "all .3s ease", fontSize: vals[i][0], height: vals[i][1], margin: 0, whiteSpace: "nowrap"}}>
            {this.props.visibility[i] === "hidden" ? '' : t}
          </div>
        ))}
      </div>
    );
  }
}
