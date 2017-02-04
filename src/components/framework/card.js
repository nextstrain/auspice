import React from "react";
import Radium from "radium";
import {headerFont, medGrey, darkGrey} from "../../globalStyles";

@Radium
class Card extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#FFFFFF",
        display: "inline-block",
        margin: 12,
        boxShadow: "2px 2px 4px 1px rgba(215,215,215,0.85)",
        borderRadius: 2,
        padding: 5,
        overflow: "hidden",
        position: "relative"
      },
      title: {
        fontFamily: headerFont,
        color: medGrey,
        fontSize: 16,
        marginBottom: 10,
        marginLeft: 10,
        marginTop: 5,
        fontWeight: 500,
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        <p style={[
          styles.title,
          this.props.titleStyles
        ]}> {this.props.title} </p>
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
