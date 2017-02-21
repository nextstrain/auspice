import React from "react";
import Flex from "./flex";
import { titleColors, titleBarHeight } from "../../util/globals";
import { titleFont, dataFont, darkGrey, medGrey, lightGrey, brandColor } from "../../globalStyles";
import Radium from "radium";
import Title from "./title";
import { Link } from "react-router-dom";

/*
This titlebar is not great, mostly becuase I'm no expert at flexbox.
You have free reign to make this titlebar great again.
*/
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
        color: brandColor,
        textDecoration: "none",
        cursor: "pointer",
        fontSize: 16
      },
      inactive: {
        alignSelf: "center",
        padding: "8px",
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
            <Link style={styles.link} to="/about">About</Link>
          }
          {this.props.methodsSelected ?
            <div style={styles.inactive}>Methods</div> :
            <Link style={styles.link} to="/methods">Methods</Link>
          }
          {this.props.helpSelected ?
            <div style={styles.inactive}>Help</div> :
            <Link style={styles.link} to="/help">Help</Link>
          }
          <div style={{flex: 1 }}/>
        </Flex>
      </div>
    );
  }
}

export default TitleBar;
