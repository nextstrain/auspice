import React from "react";
import { headerFont, medGrey } from "../../globalStyles";

class Card extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#FFFFFF",
        display: "inline-block",
        marginLeft: 12,
        marginRight: 0,
        marginTop: 8,
        marginBottom: 2,
        boxShadow: "0px 0px 4px 2px rgba(215,215,215,0.55)",
        borderRadius: 2,
        padding: 5,
        overflow: "hidden",
        position: "relative"
      },
      title: {
        fontFamily: headerFont,
        color: medGrey,
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
    const styles = this.getStyles();
    return (
      <div style={{ ...styles.base, ...this.props.style }}>
        <div style={{ ...styles.title, ...this.props.titleStyles }}>
          {this.props.title}
        </div>
        <div style={{
            display: "flex",
            justifyContent: this.props.center ? "center" : "flex-start"
          }}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Card;
