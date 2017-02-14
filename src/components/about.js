/*eslint-env browser*/
import React from "react";
import { connect } from "react-redux";

@connect()
class About extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return(
      <div>
        <h2>
          About page
        </h2>
      </div>
    );
  }
}

export default About;
