import React from 'react';
import Radium from 'radium';
// import _ from 'lodash';
import Flex from './flex';
// import { connect } from 'react-redux';
// import { FOO } from '../actions';
import Logos from "./logos";
import globalStyles from "../../globalStyles";

// @connect(state => {
//   return state.FOO;
// })
@Radium
class Footer extends React.Component {
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
      commit: "[no commit to show virus not loaded]",
      updated: "[no date to show, virus not loaded]"
    }
  }
  getStyles() {
    return {
      base: {

      },
      credits: {
        borderBottom: `1px solid ${globalStyles.lighterGrey}`,
        paddingBottom: 10,
        marginBottom: 10
      },
      names: {
        color: globalStyles.lighterGrey,
        fontSize: 14
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
      <div style={styles.credits}>
        {`Built by `}
        <a href="https://neherlab.wordpress.com/">
          Richard Neher
        </a>
          {` and `}
        <a href="http://bedford.io">
          Trevor Bedford
        </a>
        {`. Give us a shout at`}
        <a href="https://twitter.com/richardneher" target="_blank">
          @richardneher
        </a>
        {` or `}
        <a href="https://twitter.com/trvrb" target="_blank">
          {` @trvrb `}
        </a>
        {` with questions or comments. All `}
        <a href="http://github.com/blab/nextflu" target="_blank">
          {`source code`}
        </a>
        {` is freely available under the terms of the `}
        <a href="http://github.com/blab/nextflu/blob/master/LICENSE.txt" target="_blank">
          {`GNU Affero General Public License`}
        </a>
        {` Data updated `}
        <span id="updated">{this.props.virus.updated}</span>
        {` and processed with commit`}
        <span id="commit">{this.props.virus.commit}</span>
        {`. `}
      </div>
      <Flex style={styles.names}>
        {`© 2015-2016 Trevor Bedford and Richard Neher`}
      </Flex>
          <Logos/>
      </div>
    );
  }
}

export default Footer;
