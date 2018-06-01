import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Select from "react-select";
import { controlsWidth } from "../../util/globals";
import { changePage } from "../../actions/navigation";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";

@connect() // to provide dispatch
class ChooseDatasetSelect extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    selected: PropTypes.string.isRequired,
    choice_tree: PropTypes.array,
    title: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired
  }

  getStyles() {
    return {
      base: {
        width: controlsWidth,
        fontSize: 14
      }
    };
  }

  // assembles a new path from the upstream choices and the new selection
  // downstream choices will be set to defaults in parseParams
  createDataPath(dataset) {
    let p = (this.props.choice_tree.length > 0) ? "/" : "";
    p += this.props.choice_tree.join("/") + "/" + dataset;
    return p;
  }

  changeDataset(newPath) {
    // 0 analytics (optional)
    analyticsControlsEvent(`change-virus-to-${newPath.replace(/\//g, "")}`);
    // 1 reset redux controls state in preparation for a change
    if (window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference) {
      clearInterval(window.NEXTSTRAIN.animationTickReference);
      window.NEXTSTRAIN.animationTickReference = null;
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Play"
      });
    }
    this.props.dispatch(changePage({path: newPath, query: {}}));
  }

  getDatasetOptions() {
    let options = {};
    if (this.props.options) {
      options = this.props.options.map((opt) => {
        return {
          value: opt,
          label: opt
        };
      });
    }
    return options;
  }

  render() {
    const styles = this.getStyles();
    const datasetOptions = this.getDatasetOptions();
    return (
      <div style={styles.base}>
        <Select
          name="selectDataset"
          id="selectDataset"
          value={this.props.selected}
          options={datasetOptions}
          clearable={false}
          searchable={false}
          multi={false}
          onChange={(opt) => {
            // console.log("on change", opt.value, datasetOptions)
            this.changeDataset(this.createDataPath(opt.value));
          }}
        />
      </div>
    );
  }
}

export default ChooseDatasetSelect;
