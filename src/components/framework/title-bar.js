import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Flex from "./flex";
import { titleBarHeight, titleColors } from "../../util/globals";
import { darkGrey, brandColor } from "../../globalStyles";

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
        transition: "left .3s ease-out"
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
      link: {
        paddingLeft: this.props.minified ? "6px" : "12px",
        paddingRight: this.props.minified ? "6px" : "12px",
        paddingTop: "20px",
        paddingBottom: "20px",
        textDecoration: "none",
        cursor: "pointer",
        fontSize: this.props.minified ? 12 : 16,
        ':hover': {
          color: "#5DA8A3"
        }
      },
      inactive: {
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "20px",
        paddingBottom: "20px",
        color: "#5DA8A3",
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
        <img alt="" width="40" src={require("../../images/nextstrain-logo-small.png")}/>
      </Link>
    );
  }

  getLogoType(styles) {
    const title = "nextstrain";
    const rainbowTitle = title.split("").map((letter, i) =>
      <span key={i} style={{color: titleColors[i] }}>{letter}</span>
    );
    return (
      this.props.minified ?
        <div/>
        :
        <Link style={styles.title} to="/">
          {rainbowTitle}
        </Link>
    );
  }

  getLink(name, url, selected, styles) {
    const linkCol = this.props.minified ? "#fff" : darkGrey;
    return (
      selected ?
        <div style={{ ...{color: linkCol}, ...styles.inactive }}>{name}</div> :
        <Link style={{ ...{color: linkCol}, ...styles.link }} to={url}>{name}</Link>
    );
  }

  render() {
    const styles = this.getStyles();
    return (
      <Flex style={styles.main}>
        {this.getLogo(styles)}
        {this.getLogoType(styles)}
        <div style={{flex: 5}}/>
        {this.getLink("About", "/about", this.props.aboutSelected, styles)}
        {this.getLink("Methods", "/methods", this.props.methodsSelected, styles)}
        <div style={{width: this.props.minified ? 20 : 0 }}/>
      </Flex>
    );
  }
}

export default TitleBar;
