import React, { Suspense, lazy } from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import { withTranslation } from "react-i18next";
import { FaDownload, FaExternalLinkSquareAlt } from "react-icons/fa";
import { dataFont, medGrey, materialButton } from "../../globalStyles";
import { SET_MODAL } from "../../actions/types";
import Flex from "./flex";
import { version } from "../../version";
import { publications } from "../download/downloadModal";
import { hasExtension, getExtension } from "../../util/extensions";
import { canShowLinkOuts } from "../modal/LinkOutModalContents.jsx";

const logoPNG = require("../../images/favicon.png");

const MarkdownDisplay = lazy(() => import("../markdownDisplay"));

const dot = (
  <span style={{marginLeft: 10, marginRight: 10}}>
    •
  </span>
);

export const FinePrintStyles = styled.div`
  margin-left: 30px;
  padding-bottom: 30px;
  font-family: ${dataFont};
  font-size: 15px;
  font-weight: 300;
  color: rgb(136, 136, 136);
  line-height: 1.4;

  .line {
    margin-top: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid #CCC;
  }

  .finePrint {
    font-size: 14px;
  }

  .logoContainer {
    padding: 1px 1px;
    margin-right: 5px;
    width: 24px;
    cursor: pointer;
  }

  .logo {
    margin-left: 1px;
    margin-right: 1px;
    margin-top: 1px;
    margin-bottom: 3px;
  }

`;

@connect((state) => {
  return {
    tree: state.tree,
    metadata: state.metadata,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
class FinePrint extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.browserDimensions !== nextProps.browserDimensions) {
      return true;
    }
    return false;
  }

  getUpdated() {
    const { t } = this.props;
    if (this.props.metadata.updated) {
      return (<span>{t("Data updated")} {this.props.metadata.updated}</span>);
    }
    return null;
  }
  downloadDataButton() {
    const { t } = this.props;
    return (
      <button
        style={Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)", color: medGrey, margin: 0, padding: 0})}
        onClick={() => { this.props.dispatch({ type: SET_MODAL, modal: "download" }); }}
      >
        <FaDownload />
        <span style={{position: "relative", paddingLeft: '3px'}}>{" "+t("Download data")}</span>
      </button>
    );
  }
  linkOutButton() {
    const { t } = this.props;
    return (
      <button
        style={Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)", color: medGrey, margin: 0, padding: 0})}
        onClick={() => { this.props.dispatch({ type: SET_MODAL, modal: "linkOut" }); }}
      >
        <FaExternalLinkSquareAlt />
        <span style={{position: "relative", paddingLeft: '3px'}}>{" "+t("View in other platforms")}</span>
      </button>
    );
  }

  render() {
    if (!this.props.metadata || !this.props.tree.nodes) return null;
    const width = this.props.width - 30; // need to subtract margin when calculating div width
    return (
      <FinePrintStyles>
        <div style={{width: width}}>
          <Flex className='finePrint' wrap='wrap'>
            {this.getUpdated()}
            {dot}
            {this.downloadDataButton()}
            {canShowLinkOuts() && (
              <>
                {dot}
                {this.linkOutButton()}
              </>
            )}
            {dot}
            <a href="https://docs.nextstrain.org/projects/auspice/page/releases/changelog.html" target="_blank" rel="noreferrer noopener">
              {"Auspice v" + version}
            </a>
          </Flex>
          <div style={{height: "5px"}}/>
          {getCustomFinePrint()}
          {getCitation()}
        </div>
      </FinePrintStyles>
    );
  }
}

const WithTranslation = withTranslation()(FinePrint);
export default WithTranslation;

export function getCitation() {
  return (
    <Flex className='finePrint'>
      <a className='logoContainer' href="https://nextstrain.org">
        <img alt="nextstrain.org" className='logo' width="24px" src={logoPNG}/>
      </a>
      {"Powered by Nextstrain ("}
      <a href={publications.nextstrain.href} target="_blank" rel="noopener noreferrer">
        {publications.nextstrain.author} <i>{publications.nextstrain.journal}</i>
      </a>
      {")"}
    </Flex>
  );
}

export function getCustomFinePrint() {
  const markdown = hasExtension("finePrint")
    ? getExtension("finePrint")
    : null;

  if (!markdown) return null;

  return (
    <Suspense fallback={<></>}>
      <Flex className='finePrint'>
        <MarkdownDisplay
          mdstring={markdown}
          placeholder="This dataset contained a fine print message to be displayed here, however it wasn't correctly formatted." />
      </Flex>
    </Suspense>
  );
}
