import React from "react";
import { connect } from "react-redux";
import App from "../app";
import Splash from "../splash";
import Status from "../status";
import { errorNotification } from "../../actions/notifications";

export const getPageFromPathname = (pathname) => {
  if (pathname === "/") {
    return "splash";
  } else if (pathname === "/all") {
    return "splash";
  } else if (pathname.startsWith("/status")) {
    return "status";
  }
  return "app"; // fallthrough
};


@connect((state) => ({
  page: state.datasets.page
}))
class PageSelect extends React.Component {
  render() {
    // console.log("pageSelect running (should be infrequent!)", this.props.page)
    switch (this.props.page) {
      case "splash": return (<Splash/>);
      case "app" : return (<App/>);
      case "status" : return (<Status/>);
      default:
        console.error(`reduxStore.datasets.page is invalid (${this.props.page})`);
        return (<Splash/>);
    }
  }
}

export default PageSelect;
