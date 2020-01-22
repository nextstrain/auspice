import React from 'react';
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { hasExtension, getExtension } from "../../util/extensions";

const Head = () => {
  let pageTitle = "auspice";
  if (hasExtension("browserTitle")) {
    pageTitle = getExtension("browserTitle");
  }
  const displayedDataset = window.location.pathname
    .replace(/^\//g, '')
    .replace(/\/$/g, '')
    .replace(/\//g, ' / ')
    .replace(/:/g, ' : ');
  if (displayedDataset) {
    pageTitle = pageTitle + " / " + displayedDataset;
  }
  return (
    <Helmet>
      <title>
        {pageTitle}
      </title>
    </Helmet>
  );
};

/* we want this component to rerun each time the pathname changes, which we keep a copy
of in state. This allows us to detect changes such as redirects such as /flu/avian ->
/flu/avian/h5n1/ha */
export default connect(
  (state) => ({pathname: state.general.pathname})
)(Head);
