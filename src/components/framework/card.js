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
        marginLeft: 10,
        marginRight: 10,
        marginTop: 5,
        marginBottom: 5,
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
        margin: 5,
        fontWeight: 500,
        backgroundColor: "#FFFFFF"
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
        <div style={[
          styles.title,
          this.props.titleStyles
        ]}> {this.props.title} </div>
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
