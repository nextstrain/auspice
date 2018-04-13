import React from "react";
import { connect } from "react-redux";
import TitleBar from "../framework/title-bar";
import SingleDataset from "./single";


@connect((state) => {
  return {
    availableDatasets: state.datasets.availableDatasets,
    s3bucket: state.datasets.s3bucket
  };
})
class Status extends React.Component {
  getAllQueries() {
    console.warn("SHOULD ONLY EVER RUN ONCE");
    const queries = [];
    const exploreLevel = (pathSoFar, data) => {
      const keys = Object.keys(data).filter((v) => v !== "default");
      for (let key of keys) { // eslint-disable-line
        const path = [...pathSoFar, key];
        if (typeof data[key] === "string") { // i.e. zika = ""
          queries.push(path);
        } else {
          const nextLevelKey = Object.keys(data[key])[0];
          exploreLevel(path, data[key][nextLevelKey]);
        }
      }
    };
    exploreLevel([], this.props.availableDatasets.pathogen);
    return queries;
  }

  render() {
    if (!this.props.availableDatasets) {
      return null;
    }
    const queries = this.getAllQueries();
    return (
      <div>
        <TitleBar dataNameHidden/>
        {queries.map((q) => (
          <SingleDataset key={q} path={q.join("_")} bucket={this.props.s3bucket}/>
        ))}
      </div>
    );
  }
}

export default Status;
