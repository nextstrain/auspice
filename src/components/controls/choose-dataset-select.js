import React from "react";
import Select from "react-select/lib/Select";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";
import { changePage } from "../../actions/navigation";
import { controlsWidth } from "../../util/globals";


class ChooseDatasetSelect extends React.Component {
  changeDataset(newPath) {
    // 0 analytics (optional)
    analyticsControlsEvent(`change-virus-to-${newPath.replace(/\//g, "")}`);
    // 1 reset redux controls state in preparation for a change
    if (window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference) {
      clearInterval(window.NEXTSTRAIN.animationTickReference);
      window.NEXTSTRAIN.animationTickReference = null;
      this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Play"});
    }
    this.props.dispatch(changePage({path: newPath}));
  }
  render() {
    return (
      <div style={{width: controlsWidth, fontSize: 14}}>
        <Select
          value={this.props.selected}
          options={this.props.options || []}
          clearable={false}
          searchable={false}
          multi={false}
          onChange={(opt) => {
            if (opt.value !== this.props.selected) {
              this.changeDataset(`/${opt.value}`);
            }
          }}
        />
      </div>
    );
  }
}

export default ChooseDatasetSelect;
