import React from "react";

/*
 *
*/
class GridLine extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
  }

  gridline() {
    let tmp_d="";
    if (this.props.layout==="rectangular"){
      tmp_d = 'M'+this.props.x.toString() +
        " " +
        this.props.yScale.range()[0].toString() +
        " L " +
        this.props.x.toString() +
        " " +
        this.props.yScale.range()[1].toString();
    }else if (this.props.layout==="radial"){
      tmp_d = 'M '+(this.props.x).toString() +
        "  " +
        this.props.cy.toString() +
        " A " +
        this.props.rx.toString() +
        " " +
        this.props.ry.toString() +
        " 0 1 0 " +
        this.props.x.toString() +
        " " +
        (this.props.cy+0.001).toString();
    }
    return tmp_d;
  }

  render() {
    return (
    <g>
     <path
       d={this.gridline()}
       style={{
         stroke: this.props.stroke,
         strokeWidth: this.props.width,
         fill: "none"
       }}
     >
     </path>
     <text
      textAnchor={this.props.layout==="rectangular" ? "start" : "end"}
      x={(this.props.layout==="rectangular")
          ? this.props.x : this.props.cx - 5 }
      y={(this.props.layout==="rectangular")
          ? this.props.yScale.range()[1]+15
          : this.props.cy - (this.props.y - this.props.cy) }
      fontSize={12}
     >
      {this.props.label}
     </text>
    </g>
    );
  }
}

export default GridLine;

