import React from "react";
import PropTypes from 'prop-types';

/*

  flex-direction: row | row-reverse | column | column-reverse;
  flex-wrap: nowrap | wrap | wrap-reverse;
  justify-content: flex-start | flex-end | center | space-between | space-around;
  align-items: flex-start | flex-end | center | baseline | stretch;
  align-content: flex-start | flex-end | center | space-between | space-around | stretch;
  flex is growShrinkBasis

*/

class Flex extends React.Component {
  static propTypes = {
    direction: PropTypes.oneOf([
      "row", "rowReverse", "column", "columnReverse"
    ]),
    wrap: PropTypes.oneOf([
      "nowrap", "wrap", "wrap-reverse"
    ]),
    justifyContent: PropTypes.oneOf([
      "flex-start", "flex-end", "center", "space-between", "space-around"
    ]),
    alignItems: PropTypes.oneOf([
      "flex-start", "flex-end", "center", "baseline", "stretch"
    ]),
    alignContent: PropTypes.oneOf([
      "flex-start", "flex-end", "center", "space-between", "space-around", "stretch"
    ]),
    grow: PropTypes.number,
    shrink: PropTypes.number,
    basis: PropTypes.string,
    order: PropTypes.number,
    alignSelf: PropTypes.oneOf([
      "auto", "flex-start", "flex-end", "center", "baseline", "stretch"
    ]),
    children: PropTypes.node.isRequired,
    clickHandler: PropTypes.func
  }
  static defaultProps = {
    direction: "row",
    wrap: "nowrap",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "stretch",
    grow: 0,
    shrink: 1,
    basis: "auto",
    alignSelf: "auto",
    order: 0,
    style: {},
    clickHandler: () => {}
  }
  getStyles() {
    return {
      base: {
        display: "flex",
        flexDirection: this.props.direction,
        flexWrap: this.props.wrap,
        justifyContent: this.props.justifyContent,
        alignItems: this.props.alignItems,
        alignContent: this.props.alignContent,
        order: this.props.order,
        flexGrow: this.props.grow,
        flexShrink: this.props.shrink,
        flexBasis: this.props.basis,
        alignSelf: this.props.alignSelf
      },
      style: this.props.style
    };
  }

  render() {
    const styles = this.getStyles();

    return (
      <div
        id={this.props.id}
        onClick={this.props.clickHandler}
        style={{ ...styles.base, ...styles.style }}
      >
        {this.props.children}
      </div>
    );
  }
}

export default Flex;
