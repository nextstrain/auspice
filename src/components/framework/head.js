import React from 'react';
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { hasExtension, getExtension } from "../../util/extensions";

const ogImageBasePath = "https://raw.githubusercontent.com/nextstrain/nextstrain.org/master/static-site/static/";
const ogImageDefaultFragment = "logos/icon.png"
const ogImageDatasetFragment = "splash_images/"
const ogImageDatasetExtension = ".png"

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
  
  const datasetName = window.location.pathname.split('/')[1];
  let ogImageUrl = ogImageBasePath;
  if (datasetName) {
    ogImageUrl += ogImageDatasetFragment + datasetName + ogImageDatasetExtension;
  } else {
    ogImageUrl += ogImageDefaultFragment;
  }
  
  return (
    <Helmet>
      <html prefix="og: http://ogp.me/ns#" />
      <title>
        {pageTitle}
      </title>
      {metadata && metadata.title ?
        <meta name="description" content={metadata.title} /> :
        null}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={window.location} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:height" content="225" />
      <meta property="og:image:width" content="225" />
      {metadata && metadata.title ?
        <meta property="og:description" content={metadata.title} /> :
        null}
      <meta property="twitter:site" content="nextstrain" />
    </Helmet>
  );
};

/* we want this component to rerun each time the pathname changes, which we keep a copy
of in state. This allows us to detect changes such as redirects such as /flu/avian ->
/flu/avian/h5n1/ha. Similarly when the metadata changes. */
export default connect(
  (state) => ({
    pathname: state.general.pathname,
    metadata: state.metadata
  })
)(Head);
