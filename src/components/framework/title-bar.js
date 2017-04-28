import React from "react";
import { connect } from "react-redux";
import Flex from "./flex";
import { titleColors, titleBarHeight } from "../../util/globals";
import { titleFont, dataFont, darkGrey, medGrey, lightGrey, brandColor } from "../../globalStyles";
import Radium from "radium";
import Title from "./title";
import { Link } from "react-router-dom";

var RadiumLink = Radium(Link); // needed to style custom components with radium

@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions,
    datasetPathName: state.controls.datasetPathName
  };
})
@Radium
class TitleBar extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    datasetPathName: React.PropTypes.string
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
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
        background: "#fff",
        marginBottom: 5,
        overflow: "hidden"
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
          color: "rgb(80, 151, 186)",
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
      this.props.browserDimensions.width < 600 || this.props.minified ?
        <div style={{flex: "none" }}/> :
        <Link style={styles.title} to="/">
          <Title minified={true} style={styles.title}/>
        </Link>
    );
  }

  getDataName(styles) {
    return (
      this.props.dataNameHidden ? <div style={{flex: "none" }}/> :
        <div style={styles.dataName}>
          {this.props.datasetPathName.replace(/^\//, "").replace(/\//g, " / ")}
        </div>
    );
  }

  getLink(name, url, selected, styles) {
    return (
      selected ?
        <div style={styles.inactive}>{name}</div> :
        <RadiumLink style={styles.link} to={url}>{name}</RadiumLink>
    );
  }

  render() {
    const styles = this.getStyles();
    return (
      <div >
        <Flex style={styles.main}>
          {this.getLogo(styles)}
          {this.getTitle(styles)}
          {this.getDataName(styles)}
          <div style={{flex: 5}}/>
            {this.getLink("About", "/about", this.props.aboutSelected, styles)}
            {this.getLink("Methods", "/methods", this.props.methodsSelected, styles)}
          <div style={{width: this.props.minified ? 15 : 0 }}/>
        </Flex>
      </div>
    );
  }
}

export default TitleBar;
