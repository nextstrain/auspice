import React from "react";
import { connect } from "react-redux";
import App from "../app";
import About from "../../static/about";
import Methods from "../../static/methods";
import Splash from "../../static/splash";


@connect((state) => ({
  page: state.datasets.page
}))
class PageSelect extends React.Component {
  render() {
    // console.log("pageSelect running (should be infrequent!)", this.props.page)
    switch (this.props.page) {
      case "splash": {
        return (<Splash/>);
      }
      case "app" : {
        return (<App/>);
      }
      case "methods" : {
        return (<Methods/>);
      }
      case "about" : {
        return (<About/>);
      }
      default:
        console.error("trying to go to unknown page - ", this.props.page);
        return (<Splash/>);
    }
  }
}

export default PageSelect;
