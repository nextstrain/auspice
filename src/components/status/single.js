import React from "react";
import { charonAPIAddress } from "../../util/globals";
import { treeJsonToState } from "../../util/treeJsonProcessing";
import { getMinCalDateViaTree, getMaxCalDateViaTree } from "../../actions/recomputeReduxState";

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
    const apiPath = (jsonType) =>
      `${charonAPIAddress}request=json&path=${this.props.path}_${jsonType}.json&s3=${this.props.bucket}`;

    const promises = [
      fetch(apiPath("meta")).then((res) => res.json()),
      fetch(apiPath("tree")).then((res) => res.json())
    ];

    Promise.all(promises)
      .then((values) => {
        // console.log(this.props.path, values);
        const metaJSON = values[0];
        const treeJSON = values[1];
        let tree, minDate, maxDate, numTips, lastUpdated;
        try {
          tree = treeJsonToState(treeJSON, undefined);
          minDate = getMinCalDateViaTree(tree.nodes);
          maxDate = getMaxCalDateViaTree(tree.nodes);
        } catch (err) {
          console.error(this.props.path, err);
          this.setState({
            status: "Error processing tree JSON",
            backgroundColor: errorColor
          });
          return;
        }
        try {
          numTips = metaJSON.virus_count;
          lastUpdated = metaJSON.updated;
        } catch (err) {
          console.error(this.props.path, err);
          this.setState({
            status: "Error processing meta JSON",
            backgroundColor: errorColor
          });
          return;
        }
        this.setState({
          status: "loaded",
          backgroundColor: successColor,
          minDate,
          maxDate,
          numTips,
          lastUpdated
        });
      })
      .catch((err) => {
        console.error("PATH:", this.props.path, "ERR:", err);
        this.setState({
          status: "Error fetching JSONs",
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
