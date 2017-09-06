import React from "react";
import PropTypes from 'prop-types';

class ChooseLayoutButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: PropTypes.func,
    params: PropTypes.object,
    routes: PropTypes.array,
    /* component api */
    style: PropTypes.object,
    // foo: PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {

    };
  }
  render() {
    const styles = this.getStyles();
    return (

    );
  }
}

export default ChooseLayoutButton;
