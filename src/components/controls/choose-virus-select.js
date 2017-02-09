import React from "react";
import Radium from "radium";
import {select} from "../../globalStyles";
import { RESET_CONTROLS, NEW_DATASET } from "../../actions/controls";
import { loadJSONs } from "../../actions"
import { turnURLtoDataPath } from "../../util/urlHelpers";
import { connect } from "react-redux";

@Radium
@connect()
class ChooseVirusSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      base: {

      }
    };
  }

  // assembles a new path from the upstream choices and the new selection
  // downstream choices will be set to defaults in parseParams
  createPath(e) {
    let p = (this.props.choice_tree.length > 0) ? "/" : "";
    p += this.props.choice_tree.join("/") + "/" + e.target.value;
    return p;
  }

  changeDataset(newPath) {
    // 1 reset redux controls state in preparation for a change
    this.props.dispatch({type: RESET_CONTROLS})
    // 2 change URL (push, not replace)
    this.context.router.push({
      pathname: newPath,
      search: ""
    })
    // 3 load in new data (via the URL we just changed, kinda weird I know)
    const data_path = turnURLtoDataPath(this.context.router);
    if (data_path) {
      this.props.dispatch({type: NEW_DATASET, data: this.context.router.location.pathname});
      this.props.dispatch(loadJSONs(data_path));
    } else {
      console.log("Couldn't work out the dataset to load. Bad.");
    }
  }

  render() {
    // the selector below resets the path by router.push({pathname:new_path})
    // the currently selected option is passed down as this.props.selected
    // 9/19/2016: https://facebook.github.io/react/docs/forms.html#why-select-value
    return (
      <select
        style={select}
        value={this.props.selected}
        onChange={(e) => {
          if (e.target.value === this.props.title) { return; }
          this.changeDataset(this.createPath(e));
        }}
      >
        <option key={"titleOption"}> {this.props.title} </option>
        {
          this.props.options.map((option, i) => {
            return (
              <option key={i}>
                {option}
              </option>);
          })
        }
      </select>
    );
  }
}

export default ChooseVirusSelect;
