import React from "react";
import { connect } from "react-redux";
import Title from "../framework/title";
import NavBar from "../framework/nav-bar";
import Flex from "../../components/framework/flex";
import { logos } from "./logos";
import { CenterContent } from "./centerContent";
import { displayError } from "./displayError";
import { changePage } from "../../actions/navigation";
import { fetchJSON } from "../../util/serverInteraction";
import { charonAPIAddress } from "../../util/globals";

const formatDataset = (fields, dispatch) => {
  const path = fields.join("/");
  return (
    <li key={path}>
      <div
        style={{color: "#5097BA", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "94%"}}
        onClick={() => dispatch(changePage({path: `/${path}`, push: true}))}
      >
        {path}
      </div>
    </li>
  );
};


@connect((state) => ({
  errorMessage: state.datasets.errorMessage
}))
class Splash extends React.Component {
  constructor(props) {
    super(props);
    this.state = {source: undefined, available: undefined, errorMessage: undefined};
  }
  componentDidMount() {
    fetchJSON(`${charonAPIAddress}request=available&url=${window.location.pathname}`)
      .then((json) => {this.setState(json);})
      .catch((err) => {
        this.setState({errorMessage: "Error in getting available datasets"});
        console.warn(err);
      });
  }
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
          {this.props.errorMessage || this.state.errorMessage ? (
            <CenterContent>
              {displayError(this.state.errorMessage || this.props.errorMessage)}
            </CenterContent>
          ) : (
            <p style={{maxWidth: 600, marginTop: 0, marginRight: "auto", marginBottom: 20, marginLeft: "auto", textAlign: "center", fontSize: 16, fontWeight: 300, lineHeight: 1.42857143}}>
              Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data. We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread. Our goal is to aid epidemiological understanding and improve outbreak response.
            </p>
          )}
          {/* Secondly, list the available datasets */}
          {
            this.state.source && this.state.available ? (
              <CenterContent>
                <div>
                  <div style={{fontSize: "26px"}}>
                    {`Available Datasets for source ${this.state.source}`}
                  </div>
                  <ul style={{marginLeft: "-22px"}}>
                    {this.state.available.map((data) => formatDataset(data, this.props.dispatch))}
                  </ul>
                </div>
              </CenterContent>
            ) : null
          }
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
