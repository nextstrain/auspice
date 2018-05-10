import React from "react";
import { connect } from "react-redux";
import Title from "../framework/title";
// import { headerFont, materialButtonOutline } from "../../globalStyles";
import Flex from "../../components/framework/flex";
// import { analyticsNewPage, triggerOutboundEvent } from "../util/googleAnalytics";
import { logos } from "./logos";
// import { requestImage } from "../../util/clientAPIInterface";
// import { changePage } from "../../actions/navigation";
import { displayAvailableDatasets } from "./availableDatasets";
import { CenterContent } from "./centerContent";


@connect((state) => ({
  splash: state.datasets.splash,
  availableDatasets: state.datasets.availableDatasets
}))
class Splash extends React.Component {
  render() {
    return (
      <div>
        <div className="static container">
          <Flex justifyContent="center">
            <Title/>
          </Flex>
          <div className="row">
            <h1 style={{textAlign: "center", marginTop: "-10px", fontSize: "29px"}}> Real-time tracking of virus evolution </h1>
          </div>

          <p style={{maxWidth: 600, marginTop: 0, marginRight: "auto", marginBottom: 20, marginLeft: "auto", textAlign: "center", fontSize: 16, fontWeight: 300, lineHeight: 1.42857143}}>
            Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data. We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread. Our goal is to aid epidemiological understanding and improve outbreak response.
          </p>

          <CenterContent>
            <div>{"error message?!?!"}</div>
          </CenterContent>

          <CenterContent>
            {displayAvailableDatasets(this.props.availableDatasets, this.props.dispatch)}
          </CenterContent>

          <div className="bigspacer"/>

          <CenterContent>
            {logos}
          </CenterContent>

        </div>
      </div>
    );
  }
}

export default Splash;
