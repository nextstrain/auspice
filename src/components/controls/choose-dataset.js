import React from "react";
import { connect } from "react-redux";
import ChooseDatasetSelect from "./choose-dataset-select";

const renderBareDataPath = (source, fields) => (
  <div style={{ fontSize: 14 }}>
    {`Source: ${source || "unknown"}`}
    <p/>
    {`Datapath: ${fields ? fields.join("/") : "unknown"}`}
  </div>
);

@connect((state) => {
  return {
    available: state.controls.available,
    datasetFields: state.controls.datasetFields,
    source: state.controls.source
  };
})
class ChooseDataset extends React.Component {

  render() {
    /* If the server hasn't yet returned the available datasets, show the
       source & raw datapath if we have one, otherwise don't render anything.
       This helps the user know what they're looking at.
     */
    if (!this.props.available) {
      return renderBareDataPath(this.props.source, this.props.datasetFields);
    }

    const selected = this.props.datasetFields;
    const options = [[]];

    this.props.available.forEach((d) => {
      if (options[0].indexOf(d[0]) === -1) options[0].push(d[0]);
    })

    for (let idx=1; idx<selected.length; idx++) {
      /* going through the fields which comprise the current dataset
      in order to create available alternatives for each field */
      options[idx] = [];
      this.props.available.forEach((ds) => {
        if (ds[idx-1] === selected[idx-1] && options[idx].indexOf(ds[idx]) === -1) {
          options[idx].push(ds[idx]);
        }
      })
    }

    const selectors = [];

    for (let i=0; i<options.length; i++) {
      selectors.push((
        <div key={i}>
          <ChooseDatasetSelect
            dispatch={this.props.dispatch}
            source={this.props.source}
            choice_tree={selected.slice(0, i)}
            selected={selected[i]}
            options={options[i]}
          />
        </div>
      ));
    }

    return (
      <div>
        {selectors}
      </div>
    );
  }
}

export default ChooseDataset;
