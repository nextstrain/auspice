import React from "react";
import { connect } from "react-redux";
import Title from "../framework/title";
import NavBar from "../framework/nav-bar";
import Flex from "../../components/framework/flex";
import { logos } from "./logos";
import { CenterContent } from "./centerContent";
import { changePage } from "../../actions/navigation";
import { fetchJSON } from "../../util/serverInteraction";
import { charonAPIAddress } from "../../util/globals";

@connect((state) => ({
  errorMessage: state.general.message
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
        console.warn(err.message);
      });
  }
  formatDataset(fields) {
    let path = fields.join("/");
    if (this.state.source !== "live") {
      path = this.state.source + "/" + path;
    }
    return (
      <li key={path}>
        <div
          style={{color: "#5097BA", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "94%"}}
          onClick={() => this.props.dispatch(changePage({path, push: true}))}
        >
          {path}
        </div>
      </li>
    );
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
              <div>
                <p style={{color: "rgb(222, 60, 38)", fontWeight: 600, fontSize: "24px"}}>
                  {"404 / an error has occured."}
                </p>
                <p style={{color: "rgb(222, 60, 38)", fontWeight: 400, fontSize: "18px"}}>
                  {`Details: ${this.props.errorMessage || this.state.errorMessage}`}
                </p>
                <p style={{fontSize: "16px"}}>
                  {"If this keeps happening, or you believe this is a bug, please "}
                  <a href={"mailto:hello@nextstrain.org"}>{"get in contact with us."}</a>
                </p>
              </div>
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
                    {this.state.available.map((data) => this.formatDataset(data))}
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
