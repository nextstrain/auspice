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
  errorMessage: state.general.errorMessage,
  browserDimensions: state.browserDimensions.browserDimensions,
  reduxPathname: state.general.pathname
}))
class Splash extends React.Component {
  constructor(props) {
    super(props);
    /* state is set via the returned JSON from the server (aka charon) in the fetch in CDM */
    this.state = {source: undefined, narratives: false, available: undefined, errorMessage: undefined};
  }
  componentDidMount() {
    fetchJSON(`${charonAPIAddress}request=available&url=${this.props.reduxPathname}`)
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
  listAvailable() {
    if (!this.state.source) return null;
    if (!this.state.available) {
      if (this.state.source === "live" || this.state.source === "staging") {
        return (
          <CenterContent>
            <div style={{fontSize: "18px"}}>
              {`No available ${this.state.source} datasets. Try "/local/" for local datasets.`}
            </div>
          </CenterContent>
        );
      }
      return null;
    }

    let listJSX;
    /* make two columns for wide screens */
    if (this.props.browserDimensions.width > 1000) {
      const secondColumnStart = Math.ceil(this.state.available.length / 2);
      listJSX = (
        <div style={{display: "flex", flexWrap: "wrap"}}>
          <div style={{flex: "1 50%", minWidth: "0"}}>
            <ul>
              {this.state.available.slice(0, secondColumnStart).map((data) => this.formatDataset(data))}
            </ul>
          </div>
          <div style={{flex: "1 50%", minWidth: "0"}}>
            <ul>
              {this.state.available.slice(secondColumnStart).map((data) => this.formatDataset(data))}
            </ul>
          </div>
        </div>
      );
    } else {
      listJSX = (
        <ul style={{marginLeft: "-22px"}}>
          {this.state.available.map((data) => this.formatDataset(data))}
        </ul>
      );
    }
    return (
      <CenterContent>
        <div>
          <div style={{fontSize: "26px"}}>
            {`Available ${this.state.narratives ? "Narratives" : "Datasets"} for source ${this.state.source}`}
          </div>
          {listJSX}
        </div>
      </CenterContent>
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
                  {"😱 404, or an error has occured 😱"}
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
          {/* Secondly, list the available datasets / narratives */}
          {this.listAvailable()}
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
