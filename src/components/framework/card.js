import React from "react";
import { headerFont, darkGrey } from "../../globalStyles";

class Card extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#FFFFFF",
        display: "inline-block",
        marginLeft: 14,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 10,
        paddingLeft: 6,
        paddingRight: 6,
        paddingBottom: 6,
        overflow: "hidden",
        position: "relative"
      },
      title: {
        fontFamily: headerFont,
        color: darkGrey,
        fontSize: 16,
        marginLeft: 0,
        marginTop: 0,
        marginBottom: 8,
        fontWeight: 500,
        backgroundColor: "#FFFFFF",
        borderTop: "thin solid #BBB",
        minHeight: "15px"
      }
    };
  }
  getStylesInfoCard() {
    return {
      base: {
        backgroundColor: "#FFFFFF",
        display: "inline-block",
        marginLeft: 14,
        marginRight: 0,
        marginTop: 0,
        marginBottom: 10,
        paddingLeft: 6,
        paddingRight: 6,
        paddingBottom: 6,
        overflow: "hidden",
        position: "relative"
      },
      title: {
        fontFamily: headerFont,
        color: "#fff",
        fontSize: 16,
        marginLeft: 0,
        marginTop: 0,
        marginBottom: 8,
        fontWeight: 500,
        backgroundColor: "#FFFFFF"
      }
    };
  }
  render() {
    const styles = this.props.infocard ? this.getStylesInfoCard() : this.getStyles();
    return (
      <div id={`${this.props.title}Card`} style={{ ...styles.base, ...this.props.style }}>
        <div id="CardTitle" style={{ ...styles.title, ...this.props.titleStyles }}>
          {this.props.title}
        </div>
        <div
          id="CardContentContainer"
          style={{display: "flex", justifyContent: this.props.center ? "center" : "flex-start"}}
        >
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Card;
