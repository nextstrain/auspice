import React from "react";

class RectangleTreeLayout extends React.Component {
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
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
    stroke: "black",
    width: 30
  }
  getStyles() {
    return {
      stroke: this.props.stroke,
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <svg width={this.props.width} height={this.props.width} viewBox="16 19 27 22">
        <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(17.000000, 20.000000)">
          <polyline id="Path-3" stroke={styles.stroke} points="2.94117647 12.8571429 2.94117647 18.6083984 17.8459616 18.6083984 17.8459616 16.0260882 24.870031 16.0260882"></polyline>
          <polyline id="Path-4" stroke={styles.stroke} points="17.8500004 18.5714286 17.8500004 20 25.0119374 20"></polyline>
          <polyline id="Path-5" stroke={styles.stroke} points="2.94117647 12.8571429 3.00303284 7.21191058 10.2360102 7.11220045 10.4159559 2.99881623 17.1561911 2.93803403 17.1561911 0 24.313534 0"></polyline>
          <polyline id="Path-6" stroke={styles.stroke} points="17.1599998 2.85714286 17.1599998 4.28571429 24.512941 4.28571429"></polyline>
          <path d="M0,12.8571429 L2.94117647,12.8571429" id="Path-6" stroke={styles.stroke}></path>
          <polyline id="Path-7" stroke={styles.stroke} points="10.2941176 7.14285714 10.2941176 11.4285714 24.5454676 11.4285714"></polyline>
        </g>
      </svg>
    );
  }
}

export default RectangleTreeLayout;
