import React from "react";
import { connect } from "react-redux";
import TitleBar from "../framework/title-bar";

@connect()
class Status extends React.Component {

  render() {
    return (
      <div>
        <TitleBar dataNameHidden/>

        <h1>{"Dataset status"}</h1>

      </div>
    );
  }
}

export default Status;
