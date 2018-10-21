import React from "react";
import PropTypes from 'prop-types';
import Select from "react-select";
import { connect } from "react-redux";
import * as icons from "../framework/svg-icons";
import { materialButton, materialButtonSelected, brandColor, darkGrey } from "../../globalStyles";
import { CHANGE_LAYOUT, CHANGE_SCATTER } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { SelectLabel } from "../framework/select-label";

@connect((state) => {
  return {
    layout: state.controls.layout,
    scatter: state.controls.scatter,
    showTreeToo: state.controls.showTreeToo
  };
})
class ChooseLayout extends React.Component {
  static propTypes = {
    layout: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired
  }
  getStyles() {
    return {
      container: {
        marginBottom: 10
      },
      title: {
        margin: 5,
        position: "relative",
        top: -1
      }
    };
  }

  scatterSelect() {
    const options = [
      { value: 'num_date', label: 'Time' },
      { value: 'div', label: 'Divergence' },
      { value: 'ep', label: 'Epitope mutations' },
      { value: 'cTiterSub', label: 'Antgenic advancement' }
    ];
    return (
      <Select
        name="selectScatter"
        id="selectScatter"
        value={this.props.scatter !== null ? this.props.scatter : "num_date"}
        options={options}
        clearable={false}
        searchable={true}
        multi={false}
        onChange={(opt) => {
          this.props.dispatch({ type: CHANGE_SCATTER, data: opt.value });
        }}
      />
    );
  }

  render() {
    if (this.props.showTreeToo) return null;
    const styles = this.getStyles();
    const selected = this.props.layout;
    return (
      <div style={styles.container}>
        <SelectLabel text="Layout" extraStyles={{marginTop: "0px"}}/>
        <div style={{margin: 5}}>
          <icons.RectangularTree width={25} stroke={selected === "rect" ? brandColor : darkGrey}/>
          <button
            key={1}
            style={selected === "rect" ? materialButtonSelected : materialButton}
            onClick={() => {
              const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference;
              if (!loopRunning) {
                analyticsControlsEvent("change-layout-rectangular");
                this.props.dispatch({ type: CHANGE_LAYOUT, data: "rect" });
              }
            }}
          >
            <span style={styles.title}> {"rectangular"} </span>
          </button>
        </div>
        <div style={{margin: 5}}>
          <icons.RadialTree width={25} stroke={selected === "radial" ? brandColor : darkGrey}/>
          <button
            key={2}
            style={selected === "radial" ? materialButtonSelected : materialButton}
            onClick={() => {
              const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference;
              if (!loopRunning) {
                analyticsControlsEvent("change-layout-radial");
                this.props.dispatch({ type: CHANGE_LAYOUT, data: "radial" });
              }
            }}
          >
            <span style={styles.title}> {"radial"} </span>
          </button>
        </div>
        <div style={{margin: 5}}>
          <icons.UnrootedTree width={25} stroke={selected === "unrooted" ? brandColor : darkGrey}/>
          <button
            key={3}
            style={selected === "unrooted" ? materialButtonSelected : materialButton}
            onClick={() => {
              const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference;
              if (!loopRunning) {
                analyticsControlsEvent("change-layout-unrooted");
                this.props.dispatch({ type: CHANGE_LAYOUT, data: "unrooted" });
              }
            }}
          >
            <span style={styles.title}> {"unrooted"} </span>
          </button>
        </div>
        <div style={{margin: 5}}>
          <icons.Clock width={25} stroke={selected === "clock" ? brandColor : darkGrey}/>
          <button
            key={4}
            style={selected === "clock" ? materialButtonSelected : materialButton}
            onClick={() => {
              const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference;
              if (!loopRunning) {
                analyticsControlsEvent("change-layout-clock");
                this.props.dispatch({ type: CHANGE_LAYOUT, data: "clock" });
              }
            }}
          >
            <span style={styles.title}> {"scatterplot"} </span>
            {selected === "clock" ?
              <div>
                {this.scatterSelect()}
              </div> : null}
          </button>
        </div>
      </div>
    );
  }
}

export default ChooseLayout;
