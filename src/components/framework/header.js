import React from 'react';
import Radium from 'radium';
// import _ from 'lodash';
// import Flex from './framework/flex';
// import { connect } from 'react-redux';
// import { FOO } from '../actions';


// @connect(state => {
//   return state.FOO;
// })
@Radium
class Header extends React.Component {
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
    virus: {
      name: "[virus not loaded]"
    }
  }
  getStyles() {
    return {
      nextstrain: {
        fontSize: 76,
        margin: 0
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div>
        <p style={styles.nextstrain}> nextstrain </p>
        <p> Real-time tracking of {this.props.virus.name} virus evolution </p>
      </div>
    );
  }
}

export default Header;
