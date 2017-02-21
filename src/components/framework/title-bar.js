import React from "react";
import Flex from "./flex";
import { titleColors, titleBarHeight } from "../../util/globals";
import { titleFont, dataFont, darkGrey, medGrey, lightGrey, brandColor } from "../../globalStyles";
import Radium from "radium";
import Title from "./title";
import { Link } from "react-router-dom";

var RadiumLink = Radium(Link); // needed to style custom components with radium

@Radium
class TitleBar extends React.Component {
  constructor(props) {
    super(props);
  }
  // static propTypes = {
  //   dataName: React.PropTypes.string
  // }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  getStyles() {
    return {
      title: {
        fontFamily: titleFont,
        fontSize: 48,
        lineHeight: "28px",
        marginTop: 0,
        marginBottom: 2,
        fontWeight: 300,
        color: medGrey,
        paddingLeft: "8px",
        paddingRight: "0px",
        letterSpacing: "-1px"
      },
      main: {
        height: titleBarHeight,
        justifyContent: "space-between",
        backgroundColor: "#eaebeb",
        marginBottom: 5,
        boxShadow: "0px -1px 1px 1px rgba(215,215,215,0.85) inset" // from card
      },
      link: {
        alignSelf: "center",
        padding: "8px",
        color: medGrey,
        textDecoration: "none",
        cursor: "pointer",
        fontSize: 16,
        ':hover': {
          color: brandColor
        }
      },
      inactive: {
        alignSelf: "center",
        background: "#e0e1e1",
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "15px",
        paddingBottom: "15px",
        color: medGrey,
        textDecoration: "none",
        fontSize: 16
      },
      alerts: {
        textAlign: "center",
        verticalAlign: "middle",
        width: 70,
        color: brandColor
      },
      dataName: {
        fontFamily: titleFont,
        color: medGrey,
        fontSize: 24,
        fontWeight: 300,
        marginBottom: -10,
        paddingLeft: 2,
        letterSpacing: "-1px"
      }
    };
  }
  render() {
    const styles = this.getStyles();
    // const dataName = this.props.dataName ?
    //   <div style={styles.dataName}>{this.props.dataName}</div> : null;
    let dataName = this.context.router.location.pathname;
    dataName = dataName.replace(/^\//, '');
    // dataName = dataName += '|';
    if (dataName.length === 1) {dataName = "";}
    return (
      <div>
        <Flex style={styles.main}>
          <div style={{flex: 1 }}/>
          {this.props.titleHidden ? <div style={{flex: 10 }}/> :
            <Link style={styles.link} to="/">
              <Title style={styles.title}/>
            </Link>}
          {this.props.titleHidden || this.props.dataNameHidden ? <div style={{flex: 10 }}/> :
            <div style={styles.dataName}>
              {dataName}
            </div>}
          <div style={{flex: 30 }}/>
          {this.props.aboutSelected ?
            <div style={styles.inactive}>About</div> :
            <RadiumLink style={styles.link} to="/about">About</RadiumLink>
          }
          {this.props.methodsSelected ?
            <div style={styles.inactive}>Methods</div> :
            <RadiumLink style={styles.link} to="/methods">Methods</RadiumLink>
          }
          {this.props.helpSelected ?
            <div style={styles.inactive}>Help</div> :
            <RadiumLink style={styles.link} to="/help">Help</RadiumLink>
          }
          <div style={{flex: 1 }}/>
        </Flex>
      </div>
    );
  }
}

export default TitleBar;
