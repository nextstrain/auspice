import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import styled from 'styled-components';
import { headerFont } from "../../globalStyles";

/**
 * React component for the byline of the current dataset.
 * This details (non-dynamic) information about the dataset, such as the
 * maintainers, source, data provenance etc.
 */
@connect((state) => {
  return {
    metadata: state.metadata
  };
})
class Byline extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <>
        {renderAvatar(t, this.props.metadata)}
        {renderBuildInfo(t, this.props.metadata)}
        {renderMaintainers(t, this.props.metadata)}
        {renderDataProvenance(t, this.props.metadata)}
      </>
    );
  }
}

const AvatarImg = styled.img`
  margin-right: 5px;
  margin-bottom: 2px;
`;

/**
 * Renders the GitHub avatar of the current dataset for datasets with a `buildUrl`
 * which is a GitHub repo. The avatar image is fetched from GitHub (by the client).
 */
function renderAvatar(t, metadata) {
  const repo = metadata.buildUrl;
  if (typeof repo === 'string') {
    const match = repo.match(/(https?:\/\/)?(www\.)?github.com\/([^/]+)/);
    if (match) {
      return (
        <AvatarImg alt="avatar" width="28" src={`https://github.com/${match[3]}.png?size=200`}/>
      );
    }
  }
  return null;
}

/**
 * Returns a React component detailing the source of the build (pipeline).
 * Renders a <span> containing "Built with X", where X derives from `metadata.buildUrl`
 */
function renderBuildInfo(t, metadata) {
  if (Object.prototype.hasOwnProperty.call(metadata, "buildUrl")) {
    const repo = metadata.buildUrl;
    if (typeof repo === 'string') {
      if (repo.startsWith("https://") || repo.startsWith("http://") || repo.startsWith("www.")) {
        return (
          <span>
            {t("Built with")}
            {" "}
            <Link url={repo}>
              {repo.replace(/^(http[s]?:\/\/)/, "").replace(/^www\./, "").replace(/^github.com\//, "")}
            </Link>
            {". "}
          </span>
        );
      }
    }
  }
  return null;
}

/**
 * Returns a React component detailing the maintainers of the build (pipeline).
 * Renders a <span> containing "Maintained by X", where X derives from `metadata.maintainers`
 */
function renderMaintainers(t, metadata) {
  let maintainersArray;
  if (Object.prototype.hasOwnProperty.call(metadata, "maintainers")) {
    maintainersArray = metadata.maintainers;
    if (Array.isArray(maintainersArray) && maintainersArray.length) {
      return (
        <span>
          {t("Maintained by") + " "}
          {maintainersArray.map((m, i) => (
            <React.Fragment key={m.name}>
              {m.url ? <Link url={m.url}>{m.name}</Link> : m.name}
              {i === maintainersArray.length-1 ? "" : i === maintainersArray.length-2 ? " and " : ", "}
            </React.Fragment>
          ))}
          {". "}
        </span>
      );
    }
  }
  return null;
}


/**
 * Returns a React component detailing the data provenance of the build (pipeline).
 * Renders a <span> containing "Enabled by data from X", where X derives from `metadata.dataProvenance`
 * Note that this function includes logic to special-case certain values which may appear there.
 */
function renderDataProvenance(t, metadata) {
  if (!Array.isArray(metadata.dataProvenance)) return null;
  const sources = metadata.dataProvenance
    .filter((source) => typeof source === "object")
    .filter((source) => Object.prototype.hasOwnProperty.call(source, "name"))
    .map((source) => {
      if (source.name.toUpperCase() === "GISAID") { // SPECIAL CASE
        return (<Link url="https://www.gisaid.org" key={source.name}>
          <img key={source.name} src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="gisaid-logo" width="65"/>
        </Link>);
      }
      const url = parseUrl(source.url);
      if (url) {
        return <Link url={url} key={source.name}>{source.name}</Link>;
      }
      return source.name;
    });
  if (!sources.length) return null;
  return (
    <span>
      {t("Enabled by data from") + " "}
      {makePrettyList(sources)}
      {"."}
    </span>
  );
}

function makePrettyList(els) {
  if (els.length<2) return els;
  return Array.from({length: els.length*2-1})
    .map((_, idx) => idx%2===0 ? els[idx/2] : idx===els.length*2-3 ? " and " : ", ");
}


/**
 * Attempts to parse a url. Returns a valid-looking URL string or `false`.
 */
function parseUrl(potentialUrl) {
  try {
    const urlObj = new URL(potentialUrl);
    return urlObj.href;
  } catch (err) {
    return false;
  }
}

const BylineLink = styled.a`
  font-family: ${headerFont};
  font-size: 15;
  font-weight: 500;
`;

function Link({url, children}) {
  return (
    <BylineLink rel="noopener noreferrer" href={url} target="_blank">
      {children}
    </BylineLink>
  );
}

const WithTranslation = withTranslation()(Byline);
export default WithTranslation;
