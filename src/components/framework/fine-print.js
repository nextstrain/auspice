import React from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import { withTranslation } from "react-i18next";
import { FaDownload } from "react-icons/fa";
import { dataFont, medGrey, materialButton } from "../../globalStyles";
import { TRIGGER_DOWNLOAD_MODAL } from "../../actions/types";
import Flex from "./flex";
import { version } from "../../version";
import { publications } from "../download/downloadModal";

const logoPNG = require("../../images/favicon.png");

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
        onClick={() => { this.props.dispatch({ type: TRIGGER_DOWNLOAD_MODAL }); }}
      >
        <FaDownload />
        <span style={{position: "relative"}}>{" "+t("Download data")}</span>
      </button>
    );
  }

  render() {
    if (!this.props.metadata || !this.props.tree.nodes) return null;
    const width = this.props.width - 30; // need to subtract margin when calculating div width
    return (
      <FinePrintStyles>
        <div style={{width: width}}>
          <Flex className='finePrint'>
            {this.getUpdated()}
            {dot}
            {this.downloadDataButton()}
            {dot}
            {"Auspice v" + version}
          </Flex>
          <div style={{height: "5px"}}/>
          <Flex className='finePrint'>
            {getCitation()}
          </Flex>
        </div>
      </FinePrintStyles>
    );
  }
}

const WithTranslation = withTranslation()(FinePrint);
export default WithTranslation;

export function getCitation() {
  return (
    <span>
      <a className='logoContainer' href="https://nextstrain.org">
        <img alt="nextstrain.org" className='logo' width="24px" src={logoPNG}/>
      </a>
      {"Powered by Nextstrain ("}
      <a href={publications.nextstrain.href} target="_blank" rel="noopener noreferrer">
        {publications.nextstrain.author} <i>{publications.nextstrain.journal}</i>
      </a>
      {")"}
    </span>
  );
}
