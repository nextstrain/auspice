import Mousetrap from "mousetrap";
import React from "react";
import { connect } from "react-redux";
import {changeToNextColorBy} from "../../actions/colors";

/**
 * Here we have a react component which currently renders nothing.
 * It acts as a listener for keypresses and triggers the appropriate
 * (redux) actions.
 *
 * NOTE 1: There are already a few places in the codebase where we
 * listen for key-presses (search for "mousetrap"). Consider
 * centralising them here, if possible and as desired.
 *
 * NOTE 2: If we want to persue this direction, a overlay-style
 * UI could be implemented here to describe what key-presses
 * are available. See https://excalidraw.com/ for a nice example
 * of this.
 */


@connect(() => ({}))
class KeyboardShortcuts extends React.Component {
  componentDidMount() {
    Mousetrap.bind(['c'], () => {
      console.log("c", this.dispatch);
      this.props.dispatch(changeToNextColorBy());
    });
  }
  componentWillUnmount() {
    Mousetrap.unbind(['c']);
  }
  render() {
    return null;
  }
}

export default KeyboardShortcuts;
