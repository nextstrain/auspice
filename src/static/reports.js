import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import PropTypes from 'prop-types';
import TitleBar from "../components/framework/title-bar";
import { modifyURLquery, clearURLquery } from "../util/urlHelpers";
// import { analyticsNewPage } from "../util/googleAnalytics";
import { warningNotification } from "../actions/notifications";
import { charonAPIAddress } from "../util/globals";

/* This component renders the "shell" of the reports page,
i.e. headers, footers etc but not the content.
The content is delivered statically from the server */

@connect((state) => ({reports: state.datasets.reports}))
class Reports extends React.Component {
  // analyticsNewPage();
  constructor(props) {
    super(props);
    this.state = {
      showTOC: true, // the TOC
      nameOfCurrentReport: undefined
    };
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  getAndInsertReportContentViaAPI() {

    const query = queryString.parse(this.context.router.history.location.search);
    if (!query.name) {return;}
    if (this.state.nameOfCurrentReport === query.name) {return;}
    this.setState({nameOfCurrentReport: query.name});
    // this.context.router
    const errorHandler = (e) => {
      this.props.dispatch(warningNotification({message: "Failed to get report from server"}));
      console.error(e);
      this.setState({showTOC: true, nameOfCurrentReport: undefined});
      clearURLquery(this.context.router);
    };
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onload = () => {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        // console.log("server returned a report");
        // console.log(xmlHttp.responseText);
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
        if (this.reportBody) { // needed for race conditions in hot-loading situations
          this.reportBody.innerHTML = htmlString;
        }
        this.setState({showTOC: false}); // collapse the TOC
      } else {
        errorHandler(xmlHttp);
      }
    };
    xmlHttp.onerror = errorHandler;
    xmlHttp.open("get", charonAPIAddress + 'request=report&path=' + query.name, true);
    xmlHttp.send(null);
  }

  goToReportPage(name) {
    modifyURLquery(this.context.router, {name}, false);
    this.getAndInsertReportContentViaAPI();
  }

  componentDidMount() {
    this.getAndInsertReportContentViaAPI();
  }
  componentDidUpdate() {
    this.getAndInsertReportContentViaAPI();
  }

  render() {
    if (!this.props.reports) {
      return (
        <g>
          <TitleBar dataNameHidden reportsSelected/>
        </g>
      );
    }
    return (
      <g>
        <TitleBar dataNameHidden reportsSelected/>
        <div className="static reports container">
          <div className="bigspacer"/>
          {/* PART 1: the available reports (from the manifest) */}
          <div className="row">
            <div className="col-md-1"/>
            <div className="col-md-6">
              <input
                id="toggle"
                type="checkbox"
                checked={this.state.showTOC}
                onChange={() => this.setState({showTOC: !this.state.showTOC})}
              />
              <label htmlFor="toggle">
                Table of Contents
              </label>
              <div id="toc">
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
                                onClick={() => {this.goToReportPage(p.path);}}
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
            </div>
            <div className="col-md-1"/>
          </div>
          {/* PART 2: the content (inserted from the server) */}
          <div className="row">
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
