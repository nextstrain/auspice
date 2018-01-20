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

@connect()
export class Gutter extends React.Component { // eslint-disable-line
  render() {
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
        {this.props.titles.map((t, i) => {
          const style = this.props.visibility[i] === "hidden" ? {height: "0px", opacity: "0"} : {};
          return (<div key={t} style={style}>{t}</div>);
        })}
      </div>
    );
  }
}
