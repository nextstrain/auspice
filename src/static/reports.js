import React from "react";
import { connect } from "react-redux";
import PropTypes from 'prop-types';
import TitleBar from "../components/framework/title-bar";
// import { analyticsNewPage } from "../util/googleAnalytics";
import { errorNotification } from "../actions/notifications";
import { charonAPIAddress } from "../util/globals";

/* This component renders the "shell" of the reports page,
i.e. headers, footers etc but not the content.
The content is delivered statically from the server */

@connect()
class Reports extends React.Component {
  // analyticsNewPage();
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  getAndInsertReportContentViaAPI() {
    // this.context.router
    const errorHandler = (e) => {
      this.props.dispatch(errorNotification({message: "Failed to get report from server"}));
      console.error(e);
    };
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onload = () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        console.log("HERE IT IS!!!!")
        console.log(xmlHttp.responseText)
        const htmlString = xmlHttp.responseText;
        /* we now need to insert the html string into the waiting div,
        I can't really find a good guide on how to do this (WTF!).
        There seem to be 2 options:
        (1) use dangerouslySetInnerHTML
        https://stackoverflow.com/questions/29706828/how-to-render-a-react-element-using-an-html-string
        ReactDOM.render(<div dangerouslySetInnerHTML={{__html: htmlString}} />, document.getElementById('reportbody'));
        (2) use innerHTML
        https://stackoverflow.com/questions/37337289/react-js-set-innerhtml-vs-dangerouslysetinnerhtml
        */
        this.reportBody.innerHTML = htmlString;
      } else {
        errorHandler(xmlHttp);
      }
    };
    xmlHttp.onerror = errorHandler;
    xmlHttp.open("get", charonAPIAddress + 'request=report', true);
    xmlHttp.send(null);
  }

  componentDidMount() {
    console.log("Client querying API for report content")
    this.getAndInsertReportContentViaAPI();
  }

  render() {
    return (
      <g>
        <TitleBar dataNameHidden methodsSelected/>
        <div className="static container">
          <div className="row">
            <div className="col-md-1"/>
            <div ref={(c) => { this.reportBody = c; }}>
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
