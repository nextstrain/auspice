/*eslint-env browser*/
import React from "react";
import { connect } from "react-redux";

@connect()
class Help extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return(
      <div>
        <h2>
          help / / how-to-use page
        </h2>
      </div>
    );
  }
}

export default Help;
