import React from "react";
// import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Flex from "./flex";
import { titleBarHeight, titleColors } from "../../util/globals";
import { darkGrey, brandColor } from "../../globalStyles";
import { changePage } from "../../actions/navigation";

const InternalLink = (props) => (
  <div style={props.style} onClick={() => props.dispatch(changePage(props.path))}>
    {props.children}
  </div>
);

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
        color: "#000",
        cursor: "pointer",
        textDecoration: "none",
        fontSize: this.props.minified ? 12 : 16
      },
      title: {
        padding: "0px",
        color: "#000",
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
          color: "#5097BA"
        }
      },
      inactive: {
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "20px",
        paddingBottom: "20px",
        color: "#5097BA",
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
      <InternalLink dispatch={this.props.dispatch} style={styles.logo} path="/">
        <img alt="" width="40" src={require("../../images/nextstrain-logo-small.png")}/>
      </InternalLink>
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
        <InternalLink style={styles.title} dispatch={this.props.dispatch} path="/">
          {rainbowTitle}
        </InternalLink>
    );
  }

  getLink(name, url, selected, styles) {
    const linkCol = this.props.minified ? "#000" : darkGrey;
    return (
      selected ?
        <div style={{ ...{color: linkCol}, ...styles.inactive }}>{name}</div> :
        <InternalLink dispatch={this.props.dispatch} style={{ ...{color: linkCol}, ...styles.link }} path={url}>
          {name}
        </InternalLink>
    );
  }

  // {this.getLink("Posts", "/posts", this.props.postsSelected, styles)}

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
