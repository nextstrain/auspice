import React from "react";
import { getServerAddress } from "../../util/globals";
import { createStateFromQueryOrJSONs } from "../../actions/recomputeReduxState";
import { fetchJSON } from "../../util/serverInteraction";

const errorColor = "#fc8d59";
const fetchColor = "#ffffbf";
const successColor = "#91bfdb";

class SingleDataset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "loading",
      backgroundColor: fetchColor,
      minDate: undefined,
      maxDate: undefined,
      numTips: undefined,
      lastUpdated: undefined
    };
  }
  componentDidMount() {
    fetchJSON(`${getServerAddress()}/getDataset?prefix=${this.props.path}`)
      .then((json) => {
        const state = createStateFromQueryOrJSONs({json, query: ""});
        this.setState({
          status: "loaded",
          backgroundColor: successColor,
          minDate: state.controls.dateMin,
          maxDate: state.controls.dateMax,
          numTips: state.metadata.mainTreeNumTips,
          lastUpdated: json.meta.updated
        });
      })
      .catch((err) => {
        console.warn("Failed to fetch or process JSONs for", this.props.path, "ERR:", err.type);
        console.warn(err);
        this.setState({
          status: "Error fetching / processing JSONs",
          backgroundColor: errorColor
        });
      });
  }

  render() {
    const narrower = {flex: "0 0 15%"};
    const wider = {flex: "0 0 30%"};
    return (
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        backgroundColor: this.state.backgroundColor,
        margin: "10px 10px 10px 10px",
        textAlign: "center"
      }}
      >
        <h3 style={narrower}>{this.props.path}</h3>
        <h3 style={narrower}>{this.state.status}</h3>
        {this.state.status === "loaded" ? (
          [
            <h3 style={wider} key={"tips"}>{`${this.state.numTips} tips span ${this.state.minDate} to ${this.state.maxDate}`}</h3>,
            <h3 style={narrower} key={"updated"}>{`Last updated: ${this.state.lastUpdated}`}</h3>
          ]
        ) : null}
      </div>
    );
  }
}

export default SingleDataset;
