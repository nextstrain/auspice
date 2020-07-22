import Mousetrap from "mousetrap";
import React from "react";
import { connect } from "react-redux";
import {changeToNextColorBy} from "../../actions/colors";
import {sampleTraitFromUncertainty} from "../../actions/sample";

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


@connect((state) => ({
  colorBy: state.controls.colorBy,
  geoResolution: state.controls.geoResolution
}))
class KeyboardShortcuts extends React.Component {
  constructor(props) {
    super(props);
    this.rafId = 0;
  }
  componentDidMount() {
    Mousetrap.bind(['c'], () => {this.props.dispatch(changeToNextColorBy());});
    Mousetrap.bind(['s c', 'S C', 's r', 'S R'], (e, combo) => {
      this.props.dispatch(sampleTraitFromUncertainty({
        trait: combo[2].toLowerCase() === 'c' ? this.props.colorBy : this.props.geoResolution,
        returnToOriginal: combo[0]==="S"
      }));
    });
    Mousetrap.bind(['x', 'e'], (e, combo) => {
      if (this.rafId) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = 0;
        return;
      }
      const cb = () => {
        this.props.dispatch(sampleTraitFromUncertainty({
          trait: combo==="x" ? this.props.colorBy : this.props.geoResolution
        }));
        this.rafId = window.requestAnimationFrame(cb);
      };
      cb();
    });
  }
  componentWillUnmount() {
    Mousetrap.unbind(['c', 's c', 'S C', 's r', 'S R']);
  }
  render() {
    return null;
  }
}

export default KeyboardShortcuts;
