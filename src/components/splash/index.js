import React from "react";
import { connect } from "react-redux";
import Title from "../framework/title";
import NavBar from "../framework/nav-bar";
import Flex from "../../components/framework/flex";
import { logos } from "./logos";
// import { displayAvailableDatasets } from "./availableDatasets";
import { CenterContent } from "./centerContent";
import { displayError } from "./displayError";

@connect((state) => ({
  splash: state.datasets.splash,
  availableDatasets: state.datasets.availableDatasets,
  errorMessage: state.datasets.errorMessage
}))
class Splash extends React.Component {
  render() {
    return (
      <div>
        <NavBar/>

        <div className="static container">
          <Flex justifyContent="center">
            <Title/>
          </Flex>
          <div className="row">
            <h1 style={{textAlign: "center", marginTop: "-10px", fontSize: "29px"}}> Real-time tracking of virus evolution </h1>
          </div>
          {/* First: either display the error message or the intro-paragraph */}
          {this.props.errorMessage ? (
            <CenterContent>
              {displayError(this.props.errorMessage)}
            </CenterContent>
          ) : (
            <p style={{maxWidth: 600, marginTop: 0, marginRight: "auto", marginBottom: 20, marginLeft: "auto", textAlign: "center", fontSize: 16, fontWeight: 300, lineHeight: 1.42857143}}>
              Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data. We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread. Our goal is to aid epidemiological understanding and improve outbreak response.
            </p>
          )}
          {/* Secondly, list the available datasets */}
          <CenterContent>
            {"to do"}
            {/*displayAvailableDatasets(this.props.availableDatasets, this.props.dispatch)*/}
          </CenterContent>
          {/* Finally, the footer (logos) */}
          <CenterContent>
            {logos}
          </CenterContent>

        </div>
      </div>
    );
  }
}

export default Splash;
