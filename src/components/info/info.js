import React from "react";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { twoColumnBreakpoint } from "../../util/globals";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";

@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions,
    metadata: state.metadata.metadata
  };
})
class Info extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    sidebar: React.PropTypes.bool.isRequired
  }

  getStyles() {
    let fontSize = 36;
    if (this.props.browserDimensions.width < 1000) {
      fontSize = 32;
    }
    if (this.props.browserDimensions.width < 800) {
      fontSize = 28;
    }
    if (this.props.browserDimensions.width < 600) {
      fontSize = 24;
    }
    if (this.props.browserDimensions.width < 400) {
      fontSize = 24;
    }
    return {
      title: {
        fontFamily: titleFont,
        fontSize: fontSize,
        marginLeft: 5,
        marginTop: 5,
        marginBottom: 10,
        fontWeight: 300,
        color: darkGrey,
        letterSpacing: "-1px",
        maxWidth: 960
      },
      n: {
        fontFamily: headerFont,
        fontSize: 15,
        lineHeight: "28px",
        marginLeft: 10,
        marginTop: 5,
        marginBottom: 10,
        fontWeight: 500,
        color: medGrey
      }
    };
  }

  render() {
    const responsive = computeResponsive({
      horizontal: this.props.browserDimensions && this.props.browserDimensions.width > twoColumnBreakpoint ? 0.5 : 1,
      vertical: 1.0,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar,
      minHeight: 480,
      maxAspectRatio: 1.0
    });
    let title = "";
    if (this.props.metadata && this.props.metadata.title) {
      title = this.props.metadata.title;
    }
    const styles = this.getStyles();
    return (
      <Card center>
        <div
          style={{
            width: responsive.width,
            display: "inline-block"
          }}
        >
          <div width={responsive.width} style={styles.title}>
            {title}
          </div>
          <div width={responsive.width} style={styles.n}>
            {"Showing XXX out of XXX viruses"}
          </div>
        </div>
      </Card>
    );
  }
}

export default Info;
