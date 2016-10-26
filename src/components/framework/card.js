import React from "react";
import Radium from "radium";
// import { connect } from "react-redux";
import globalStyles from "../../globalStyles";

@Radium
class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      base: {
        backgroundColor: "#FFFFFF",
        margin: 12,
        boxShadow: "3px 3px 12px 2px rgba(217,217,217,0.85)",
        borderRadius: 4,
        padding: 5,
        position: "relative"
      },
      title: {
        fontFamily: globalStyles.sans,
        marginBottom: 0,
        marginLeft: 10,
        marginTop: 10,
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
        <p style={styles.title}> {this.props.title} </p>

        {this.props.children}
      </div>
    );
  }
}

export default Card;
