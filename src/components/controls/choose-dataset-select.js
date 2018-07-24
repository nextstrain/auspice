import React from "react";
import Select from "react-select";
import { controlsWidth } from "../../util/globals";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";
import { changePage } from "../../actions/navigation";

class ChooseDatasetSelect extends React.Component {
  getStyles() {
    return {
      base: {
        width: controlsWidth,
        fontSize: 14
      }
    };
  }

  createDataPath(dataset) {
    let p = (this.props.choice_tree.length > 0) ? "/" : "";
    p += this.props.source + "/";
    p += this.props.choice_tree.join("/") + "/" + dataset;
    p = p.replace(/\/+/, "/");
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
    this.props.dispatch(changePage({path: newPath}));
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
