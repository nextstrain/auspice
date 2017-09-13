import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import PropTypes from 'prop-types';
import TitleBar from "../components/framework/title-bar";
// import { analyticsNewPage } from "../util/googleAnalytics";
import { errorNotification } from "../actions/notifications";
import { charonAPIAddress } from "../util/globals";

/* This component renders the "shell" of the reports page,
i.e. headers, footers etc but not the content.
The content is delivered statically from the server */

export const getReportBody = (router, dispatch) => {
  const errorHandler = (e) => {
    dispatch(errorNotification({message: "Failed to get report from server"}));
    console.error(e);
  };
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      console.log("HERE IT IS!!!!")
      console.log(xmlHttp.responseText)
    } else {
      errorHandler(xmlHttp);
    }
  };
  xmlHttp.onerror = errorHandler;
  xmlHttp.open("get", charonAPIAddress + 'request=report', true);
  xmlHttp.send(null);
};

@connect()
class Reports extends React.Component {
  // analyticsNewPage();
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  componentDidMount() {

    console.log("firing off a server rendering request here")
    console.log("on the callback I think we render into the (empty) DIV.")
    getReportBody(this.context.router, this.props.dispatch);
  }

  render() {
    return (
      <g>
        <TitleBar dataNameHidden methodsSelected/>
        <div className="static container">
          <div className="row">
            <div className="col-md-1"/>
            <div id="reportbody">
              To Be Replaced by server rendered content
              <br/>
              (this should be a spinner i think)
            </div>
          </div>
        </div>
      </g>
    );
  }
}


export default Reports;
