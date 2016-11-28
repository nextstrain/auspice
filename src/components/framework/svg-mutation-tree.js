import React from "react";

//TODO: implement proper button
class MutationTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
    stroke: "black",
    width: 30
  }
  getStyles() {
    return {
      stroke: this.props.stroke
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <svg width={this.props.width} height={this.props.width} viewBox="14 14 25 26" >
        <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"
          transform="translate(15.000000, 15.000000)"
        >
          <text text="M"></text>
        </g>
      </svg>
    );
  }
}

export default MutationTree;
