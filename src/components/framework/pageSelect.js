import React from "react";
import { connect } from "react-redux";
import App from "../app";
import Splash from "../splash";
import Status from "../status";
import { errorNotification } from "../../actions/notifications";

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
      case "status" : {
        return (<Status/>);
      }
      default:
        this.props.dispatch(errorNotification({
          message: "404",
          details: `${this.props.page} doesn't exist!`
        }));
        console.error("trying to go to unknown page - ", this.props.page);
        return (<Splash/>);
    }
  }
}

export default PageSelect;
