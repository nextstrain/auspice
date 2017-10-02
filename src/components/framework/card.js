import React from "react";
import { headerFont, darkGrey } from "../../globalStyles";

class Card extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#FFFFFF",
        display: "inline-block",
        marginLeft: 12,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 10,
        // boxShadow: "0px 0px 4px 2px rgba(215,215,215,0.55)",
        borderRadius: 2,
        padding: 5,
        overflow: "hidden",
        position: "relative"
      },
      title: {
        fontFamily: headerFont,
        color: darkGrey,
        fontSize: 16,
        marginLeft: 2,
        marginTop: 2,
        marginBottom: 5,
        fontWeight: 500,
        backgroundColor: "#FFFFFF",
        borderTop: "thin solid #CCC"
      }
    };
  }
  getStylesInfoCard() {
    return {
      base: {
        backgroundColor: "#FFFFFF",
        display: "inline-block",
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 10,
        borderRadius: 2,
        paddingLeft: 17,
        paddingRight: 5,
        paddingTop: 5,
        paddingBottom: 5,
        overflow: "hidden",
        position: "relative"
      },
      title: {
        fontFamily: headerFont,
        color: "#fff",
        fontSize: 16,
        marginLeft: 2,
        marginTop: 2,
        marginBottom: 5,
        fontWeight: 500,
        backgroundColor: "#FFFFFF"
      }
    };
  }
  render() {
    const styles = this.props.infocard ? this.getStylesInfoCard() : this.getStyles();
    return (
      <div style={{ ...styles.base, ...this.props.style }}>
        <div style={{ ...styles.title, ...this.props.titleStyles }}>
          {this.props.title}
        </div>
        <div style={{
          display: "flex",
          justifyContent: this.props.center ? "center" : "flex-start"
        }}
        >
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Card;
