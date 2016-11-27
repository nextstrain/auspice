import React from "react";

class RadialTreeLayout extends React.Component {
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
      <svg width={this.props.width} height={this.props.width} viewBox="14 14 25 26" >
        <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(15.000000, 15.000000)">
          <path d="M15,15 L17.6450195,15" id="Path-12" stroke={styles.stroke}></path>
          <path d="M15.229248,22.5795898 L15.229248,18.2854004 C15.229248,18.2854004 17.8465223,17.6291504 17.8508301,15.0574951 C17.8551378,12.4858398 15.2944336,11.9138184 15.2944336,11.9138184 L15.229248,7.53540039" id="Path-13" stroke={styles.stroke}></path>
          <path d="M7.63037109,6.10498047 L10.230957,9.08325195 C10.230957,9.08325195 12.25,7.08233714 15.126709,7.04162598 C18.003418,7.00091481 20.5390625,8.91748047 20.5390625,8.91748047 L22.9765625,5.60839844" id="Path-14" stroke={styles.stroke}></path>
          <path d="M0.15942005,4.99135298 L2.76065146,7.96962446 C2.76065146,7.96962446 4.78019556,5.96870965 7.65761856,5.92799848 C10.5350415,5.88728732 13.0713154,7.80385298 13.0713154,7.80385298 L15.5094204,4.49477094" id="Path-14" stroke={styles.stroke} transform="translate(7.834420, 6.232198) rotate(-34.000000) translate(-7.834420, -6.232198) "></path>
          <path d="M7.5,21.496582 L10.1005859,24.4748535 C10.1005859,24.4748535 12.1196289,22.4739387 14.9963379,22.4332275 C17.8730469,22.3925164 20.4086914,24.309082 20.4086914,24.309082 L22.8461914,21" id="Path-14" stroke={styles.stroke} transform="translate(15.173096, 22.737427) scale(1, -1) translate(-15.173096, -22.737427) "></path>
        </g>
      </svg>
    );
  }
}

export default RadialTreeLayout;
