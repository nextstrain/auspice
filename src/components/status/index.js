import React from "react";
import { connect } from "react-redux";
import Flex from "../framework/flex";
import SingleDataset from "./single";
import { materialButton } from "../../globalStyles";
import { goTo404 } from "../../actions/navigation";
import { fetchJSON } from "../../util/serverInteraction";
import { charonAPIAddress } from "../../util/globals";

@connect()
class Status extends React.Component {
  constructor(props) {
    super(props);
    this.state = {source: undefined, available: undefined};
  }
  componentDidMount() {
    fetchJSON(`${charonAPIAddress}/getAvailable?prefix=${window.location.pathname}`)
      .then((json) => {this.setState(json);})
      .catch((err) => {
        console.warn(err);
        this.props.dispatch(goTo404("Error getting available datasets"));
      });
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
          {`Status of available datasets for source "${this.state.source}"`}
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
    if (!this.state.source || !this.state.datasets) return null;
    return (
      <div style={{maxWidth: 1020, marginLeft: "auto", marginRight: "auto"}}>

        {this.getBadges()}

	{this.state.datasets.map((fields) => {
          const path = `/${this.state.source}/${fields.join("/")}`.replace(/\/+/, "/");
          return (<SingleDataset key={path} path={path}/>);
        })}

      </div>
    );
  }
}

export default Status;
