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
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
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
        fontSize: 24,
        alignSelf: "center",
        fontWeight: 400,
        color: "#fff",
        paddingLeft: "8px",
        paddingRight: "8px",
        letterSpacing: "-1px"
      },
      main: {
        height: titleBarHeight,
        justifyContent: "space-between",
        // #4377CD, #5097BA, #63AC9A blues
        // #D4B13F, #E49938, #E67030 oranges
        // #63AC9A, #7CB879, #9ABE5C greens
        // #5097BA, #63AC9A, #7CB879 blue-greens
        // #B9BC4A, #D4B13F, #E49938 yellows
        // background: "linear-gradient(to right, #B9BC4A, #D4B13F, #E49938)",
        background: "#4b4e4e",
        marginBottom: 5,
        boxShadow: "1px 1px 2px 1px rgba(215,215,215,0.85)",
        overflow: "hidden"
      },
      link: {
        alignSelf: "center",
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "20px",
        paddingBottom: "20px",
        color: "#fff",
        textDecoration: "none",
        cursor: "pointer",
        fontSize: this.props.minified ? 12 : 16,
        ':hover': {
          background: "rgba(215,215,215,0.10)"
        }
      },
      inactive: {
        alignSelf: "center",
        background: "rgba(215,215,215,0.10)",
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "20px",
        paddingBottom: "20px",
        color: "#fff",
        textDecoration: "none",
        fontSize: this.props.minified ? 12 : 16
      },
      alerts: {
        textAlign: "center",
        verticalAlign: "middle",
        width: 70,
        color: brandColor
      },
      dataName: {
        alignSelf: "center",
        padding: "0px",
        color: "#fff",
        textDecoration: "none",
        fontSize: 20
      }
    };
  }
  render() {
    const styles = this.getStyles();
    // const dataName = this.props.dataName ?
    //   <div style={styles.dataName}>{this.props.dataName}</div> : null;
    let dataName = this.context.router.location.pathname;
    dataName = dataName.replace(/^\//, '').replace(/\/$/, '');
    // dataName = dataName += '|';
    if (dataName.length === 1) {dataName = "";}
    return (
      <div>
        <Flex style={styles.main}>
          {this.props.titleHidden ? <div style={{flex: 1 }}/> :
            <Link style={styles.link} to="/">
              { this.props.browserDimensions.width < 600 || this.props.minified ?
                <img width="40" src={require("../../images/nextstrain-logo-small.png")}/> :
                <span>
                  <img width="40" src={require("../../images/nextstrain-logo-small.png")}/>
                  <Title minified={true} style={styles.title}/>
                </span>
              }
            </Link>}
          {this.props.titleHidden || this.props.dataNameHidden ? <div style={{flex: 1 }}/> :
            <div style={styles.dataName}>
              {dataName}
            </div>}
          <div style={{flex: 3 }}/>
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
