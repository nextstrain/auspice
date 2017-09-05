import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Flex from "./flex";
import { titleBarHeight } from "../../util/globals";
import { darkGrey, brandColor } from "../../globalStyles";
import Title from "./title";

@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions,
    datasetPathName: state.controls.datasetPathName
  };
})
class TitleBar extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    datasetPathName: PropTypes.string
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  getStyles() {
    return {
      main: {
        maxWidth: 960,
        marginTop: "auto",
        marginRight: "auto",
        marginBottom: "auto",
        marginLeft: "auto",
        height: titleBarHeight,
        justifyContent: "space-between",
        alignItems: "center",
        overflow: "hidden",
        left: 0,
        zIndex: 1001,
        transition: "left .3s ease-out",
        background: "#FFF",
        width: this.props.minified ? 320 : "auto"
      },
      logo: {
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "20px",
        paddingBottom: "20px",
        color: "#fff",
        textDecoration: "none",
        fontSize: this.props.minified ? 12 : 16
      },
      title: {
        padding: "0px",
        color: "#fff",
        textDecoration: "none",
        fontSize: 20,
        fontWeight: 400
      },
      dataName: {
        alignSelf: "center",
        padding: "0px",
        color: darkGrey,
        textDecoration: "none",
        fontSize: 20,
        fontWeight: 400
      },
      link: {
        paddingLeft: this.props.minified ? "6px" : "12px",
        paddingRight: this.props.minified ? "6px" : "12px",
        paddingTop: "20px",
        paddingBottom: "20px",
        color: darkGrey,
        textDecoration: "none",
        cursor: "pointer",
        fontSize: this.props.minified ? 12 : 16,
        ':hover': {
          color: "rgb(80, 151, 186)"
        }
      },
      inactive: {
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "20px",
        paddingBottom: "20px",
        color: "rgb(80, 151, 186)",
        textDecoration: "none",
        fontSize: this.props.minified ? 12 : 16
      },
      alerts: {
        textAlign: "center",
        verticalAlign: "middle",
        width: 70,
        color: brandColor
      }
    };
  }

  getLogo(styles) {
    return (
        <Link style={styles.logo} to="/">
          <img width="40" src={require("../../images/nextstrain-logo-small.png")}/>
        </Link>
    );
  }

  getTitle(styles) {
    return (
      this.props.splash ?
        <div style={{flex: "none" }}/> :
        <Link style={styles.title} to="/">
          <Title minified={true} style={styles.title}/>
        </Link>
    );
  }

  getDataName(styles) {
    return (
      this.props.dataNameHidden || this.props.datasetPathName === undefined ?
      <div style={{flex: "none" }}/> :
      <div style={styles.dataName}>
        {this.props.datasetPathName.replace(/^\//, "").replace(/\//g, " / ")}
      </div>
    );
  }

  getLink(name, url, selected, styles) {
    return (
      selected ?
        <div style={styles.inactive}>{name}</div> :
        <Link style={styles.link} to={url}>{name}</Link>
    );
  }

  render() {
    const styles = this.getStyles();
    return (
      <Flex style={styles.main}>
        {this.getLogo(styles)}
        {this.getTitle(styles)}
        <div style={{flex: 5}}/>
          {this.getLink("About", "/about", this.props.aboutSelected, styles)}
          {this.getLink("Methods", "/methods", this.props.methodsSelected, styles)}
        <div style={{width: this.props.minified ? 15 : 0 }}/>
      </Flex>
    );
  }
}

export default TitleBar;
