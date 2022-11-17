import React from 'react';
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { PLAUSIBLE_DATA_DOMAIN, PLAUSIBLE_SRC } from "../../util/plausible";
import { hasExtension, getExtension } from "../../util/extensions";

const Head = ({metadata}) => {
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
      {metadata && metadata.title ?
        <meta name="description" content={metadata.title} /> :
        null}

      {(PLAUSIBLE_DATA_DOMAIN && PLAUSIBLE_SRC) &&
        <script async defer data-domain={PLAUSIBLE_DATA_DOMAIN} src={PLAUSIBLE_SRC} />}

    </Helmet>
  );
};

/* we want this component to rerun each time the pathname changes, which we keep a copy
of in state. This allows us to detect changes such as redirects such as /flu/avian ->
/flu/avian/h5n1/ha. Similarly when the metadata changes. */
export default connect(
  (state) => ({
    pathname: state.general.pathname,
    metadata: state.metadata,
    general: state.general
  })
)(Head);
