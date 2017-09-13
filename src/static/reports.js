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

@connect((state) => ({reports: state.datasets.reports}))
class Reports extends React.Component {
  // analyticsNewPage();
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  getAndInsertReportContentViaAPI(requestedPath) {
    // this.context.router
    const errorHandler = (e) => {
      this.props.dispatch(errorNotification({message: "Failed to get report from server"}));
      console.error(e);
    };
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onload = () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        console.log("server delivered the following HTML:");
        console.log(xmlHttp.responseText);
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
    xmlHttp.open("get", charonAPIAddress + 'request=report&path=' + requestedPath, true);
    xmlHttp.send(null);
  }

  componentDidMount() {
    // console.log("Client querying API for report content")
    // this.getAndInsertReportContentViaAPI();
  }

  render() {
    const mainTitle = (
      <div className="row">
        <div className="col-md-1"/>
        <div className="col-md-7">
          <h1>Reports</h1>
        </div>
      </div>
    );
    if (!this.props.reports) {
      return (
        <g>
          <TitleBar dataNameHidden methodsSelected/>
          {mainTitle}
          <div>
            awaiting manifest....
          </div>
        </g>
      );
    }
    return (
      <g>
        <TitleBar dataNameHidden methodsSelected/>
        <div className="static container">
          {mainTitle}
          {/* PART 1: the available reports (from the manifest) */}
          <div className="row">
            <div className="col-md-1"/>
            <div className="col-md-6" ref={(c) => { this.reportBody = c; }}>
              {this.props.reports.map((d) => {
                return (
                  <g key={d.title}>
                    <h3>{d.title}</h3>
                    <ul>
                      {d.posts.map((p) => {
                        return (
                          <li key={p.title}>
                            <div
                              className={"clickable"}
                              tabIndex="0"
                              role="button"
                              onClick={() => {this.getAndInsertReportContentViaAPI(p.path);}}
                            >
                              {p.title}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </g>
                );
              })}
            </div>
            <div className="col-md-1"/>
          </div>
          {/* PART 2: the content (inserted from the server) */}
          <div className="reports row">
            <div className="col-md-1"/>
            <div className="col-md-10" ref={(c) => { this.reportBody = c; }} />
            <div className="col-md-1"/>
          </div>
        </div>
      </g>
    );
  }
}


export default Reports;
