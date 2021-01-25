import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import styled from 'styled-components';
import { headerFont } from "../../globalStyles";

@connect((state) => {
  return {
    metadata: state.metadata
  };
})
class Byline extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;

    /** Render a special byline for nexstrain's nCoV (SARS-CoV-2) builds.
     * This is somewhat temporary and may be switched to a nextstrain.org
     * auspice customisation in the future.
     */
    if (
      // comment out the next line for testing on localhost
      (window.location.hostname === "nextstrain.org" || window.location.hostname === "dev.nextstrain.org") &&
      window.location.pathname.startsWith("/ncov")
    ) {
      return (
        <>
          {renderAvatar(t, this.props.metadata)}
          {renderMaintainers(t, this.props.metadata)}
          {
            this.props.metadata.buildUrl &&
            <span>
              {" Enabled by data from "}
              <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="gisaid-logo" width="65"/>
            </span>
          }
        </>
      );
    }
    /* End nextstrain-specific ncov / SARS-CoV-2 code */

    return (
      <>
        {renderAvatar(t, this.props.metadata)}
        {renderBuildInfo(t, this.props.metadata)}
        {renderMaintainers(t, this.props.metadata)}
      </>
    );
  }
}

const AvatarImg = styled.img`
  margin-right: 5px;
  margin-bottom: 2px;
`;

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
 * Render the byline of the page to indicate the source of the build (often a GitHub repo)
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
          {"."}
        </span>
      );
    }
  }
  return null;
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
