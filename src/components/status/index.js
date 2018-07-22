import React from "react";
import { connect } from "react-redux";
import Flex from "../framework/flex";
import SingleDataset from "./single";
import { materialButton } from "../../globalStyles";
import { getAvailableDatasets, getSource } from "../../actions/getAvailableDatasets";
import { goTo404 } from "../../actions/navigation";

@connect((state) => {
  return {
    available: state.datasets.available,
    source: state.datasets.source
  };
})
class Status extends React.Component {
  constructor(props) {
    super(props);
    this.state = {source: getSource()};
  }
  componentDidMount() {
    if (!this.state.source) {
      this.props.dispatch(goTo404("Couldn't identify source"));
    }
    if (this.props.source !== this.state.source) {
      this.props.dispatch(getAvailableDatasets(this.state.source));
    }
  }
  getBadges() {
    return (
      <Flex wrap="wrap" justifyContent="space-between" alignItems="center">
        <div>
          <a href="/"
            style={{
              paddingLeft: "8px",
              paddingRight: "8px",
              paddingTop: "20px",
              paddingBottom: "20px"}}
          >
            <img alt="" width="40" src={require("../../images/nextstrain-logo-small.png")}/>
          </a>
        </div>
        <div style={{flex: 1}}/>
        <div style={{fontSize: 18}}>
          {`Status of available datasets for source "${this.props.source}"`}
        </div>
        <div style={{flex: 3}}/>
        <div>
          <a href="https://travis-ci.com/nextstrain/auspice">
            <button style={materialButton}>
              Auspice
              <div style={{margin: "5px"}}>
                <img alt="auspice-badge" src="https://travis-ci.com/nextstrain/auspice.svg?branch=release"/>
              </div>
            </button>
          </a>
        </div>
        <div style={{width: "10px"}}/>
        <div>
          <a href="https://travis-ci.com/nextstrain/static">
            <button style={materialButton}>
              Static
              <div style={{margin: "5px"}}>
                <img alt="static-badge" src="https://travis-ci.com/nextstrain/static.svg?branch=master"/>
              </div>
            </button>
          </a>
        </div>
      </Flex>
    );
  }

  render() {
    if (this.props.source !== this.state.source) return null;
    return (
      <div style={{maxWidth: 1020, marginLeft: "auto", marginRight: "auto"}}>

        {this.getBadges()}

        {this.props.available.map((fields) => {
          const path = `/${this.props.source}/${fields.join("/")}`.replace(/\/+/, "/");
          return (<SingleDataset key={path} path={path}/>);
        })}

      </div>
    );
  }
}

export default Status;
