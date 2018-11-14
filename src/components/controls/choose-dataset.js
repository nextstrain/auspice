import React from "react";
import { connect } from "react-redux";
import { withTheme } from 'styled-components';
import ChooseDatasetSelect from "./choose-dataset-select";

const GithubInfo = withTheme((props) => {
  const parts = window.location.pathname.split("/");
  const repoURL = `github.com/${parts[2]}/${parts[3]}`;
  return (
    <div style={{ fontSize: 14, marginTop: 5, marginBottom: 5, color: props.theme.color}}>
      <i className="fa fa-clone fa-lg" aria-hidden="true"/>
      <span style={{position: "relative", paddingLeft: 10}}/>
      <a href={`https://${repoURL}`} target="_blank">{repoURL}</a>
    </div>
  );
});

const DroppedFiles = withTheme((props) => {
  /* TODO: this shouldn't be in the auspice src, rather injected as an extension when needed */
  return (
    <div style={{ fontSize: 14, marginTop: 5, marginBottom: 5, color: props.theme.color}}>
      <i className="fa fa-clone fa-lg" aria-hidden="true"/>
      <span style={{position: "relative", paddingLeft: 10}}>{"dropped files"}</span>
    </div>
  );
});

const BareDataPath = withTheme((props) => (
  <div style={{ fontSize: 14, color: props.theme.color }}>
    {`Source: ${props.source || "unknown"}`}
    <p/>
    {`Datapath: ${props.pathname}`}
  </div>
));

const checkEqualityOfArrays = (arr1, arr2, upToIdx) => {
  return arr1.slice(0, upToIdx).every((value, index) => value === arr2[index]);
};

@connect((state) => {
  return {
    available: state.controls.available,
    source: state.controls.source
  };
})
class ChooseDataset extends React.Component {
  render() {
    /* If the server hasn't yet returned the available datasets, show the
       source & raw datapath if we have one, otherwise don't render anything.
       This helps the user know what they're looking at.
     */
    if (!this.props.available || !this.props.available.datasets) {
      /* TODO expose this to the extension API */
      if (this.props.source === "github") {
	return (<GithubInfo/>);
      } else if (this.props.source === "dropped") {
	return (<DroppedFiles/>);
      }
      return (<BareDataPath source={this.props.source} pathname={this.props.pathname}/>);
    }

    const displayedDataset = window.location.pathname
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .split("/");
    displayedDataset.forEach((part, idx) => {
      if (part.includes(":")) {
	displayedDataset[idx] = part.split(":")[0];
      }
    });

    const options = [[]];

    this.props.available.datasets.forEach((d) => {
      const firstField = d.request.split("/")[0];
      if (!options[0].includes(firstField)) {
	options[0].push(firstField);
      }
    });

    for (let idx=1; idx<displayedDataset.length; idx++) {
      /* going through the fields which comprise the current dataset
      in order to create available alternatives for each field */
      options[idx] = [];
      this.props.available.datasets.forEach((singleAvailableOption) => {
	/* if the parents (and their parents etc) of this choice match,
	then we add that as a valid option */
	const fields = singleAvailableOption.request.split("/");
	if (checkEqualityOfArrays(fields, displayedDataset, idx) && options[idx].indexOf(fields[idx]) === -1) {
	  options[idx].push(fields[idx]);
	}
      });
    }

    const selectors = [];
    for (let i=0; i<options.length; i++) {
      selectors.push((
        <div key={i}>
          <ChooseDatasetSelect
            dispatch={this.props.dispatch}
            source={this.props.source}
	    choice_tree={displayedDataset.slice(0, i)}
	    selected={displayedDataset[i]}
            options={options[i]}
          />
        </div>
      ));
    }
    return selectors;
  }
}

export default ChooseDataset;
