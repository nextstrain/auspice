import React from 'react';
import Radium from 'radium';
// import _ from 'lodash';
import Flex from '../framework/flex';
// import { connect } from 'react-redux';
// import { FOO } from '../actions';


// @connect(state => {
//   return state.FOO;
// })
@Radium
class ComponentName extends React.Component {
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

      },
      container: {
        marginTop: 20
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <Flex style={styles.container} justifyContent="center">
        <a href="http://www.fredhutch.org/">
          <img width="125" src="/images/fred-hutch-logo-small.png"/>
        </a>
        <a href="http://www.eb.tuebingen.mpg.de/">
          <img width="60" src="/images/max-planck-logo-small.png"/>
        </a>
        <a href="https://www.nih.gov/">
          <img width="52" src="/images/nih-logo-small.png"/>
        </a>
        <a href="https://erc.europa.eu/">
          <img width="60" src="/images/erc-logo-small.png"/>
        </a>
      </Flex>
    );
  }
}

export default ComponentName;
