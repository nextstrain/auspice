/*eslint-env browser*/
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import TitleBar from "./framework/title-bar";

@connect()
class Splash extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return(
      <div>
        <TitleBar/>
        <h2>
          SPLASH PAGE
        </h2>
        <ul>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/zika">Load Zika</Link></li>
          <li><Link to="/ebola">Load Ebola</Link></li>
        </ul>
      </div>
    );
  }
}

export default Splash;
