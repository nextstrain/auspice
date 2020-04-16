import React from "react";
import { connect } from "react-redux";
import marked from "marked";
import dompurify from "dompurify";
import styled from 'styled-components';
import { withTranslation } from "react-i18next";
import { FaDownload } from "react-icons/fa";
import { dataFont, medGrey, materialButton } from "../../globalStyles";
import { TRIGGER_DOWNLOAD_MODAL } from "../../actions/types";
import Flex from "./flex";
import { applyFilter } from "../../actions/tree";
import { version } from "../../version";
import { publications } from "../download/downloadModal";
import { isValueValid } from "../../util/globals";
import hardCodedFooters from "./footer-descriptions";

const dot = (
  <span style={{marginLeft: 10, marginRight: 10}}>
    •
  </span>
);

const FooterStyles = styled.div`
  margin-left: 30px;
  padding-bottom: 30px;
  font-family: ${dataFont};
  font-size: 15px;
  font-weight: 300;
  color: rgb(136, 136, 136);
  line-height: 1.4;

  h1 {
    font-weight: 700;
    font-size: 2.2em;
    margin: 0.2em 0;
  }

  h2 {
    font-weight: 600;
    font-size: 2em;
    margin: 0.2em 0;
  }

  h3 {
    font-weight: 500;
    font-size: 1.8em;
    margin: 0.2em 0;
  }

  h4 {
    font-weight: 500;
    font-size: 1.6em;
    margin: 0.1em 0;
  }

  h5 {
    font-weight: 500;
    font-size: 1.4em;
    margin: 0.1em 0;
  }

  h6 {
    font-weight: 500;
    font-size: 1.2em;
    margin: 0.1em 0;
  }

  // Style for code block
  pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 3px;
  }

  // Code within code block
  pre code {
    padding: 0;
    margin: 0;
    overflow: visible;
    font-size: 100%;
    line-height: inherit;
    word-wrap: normal;
    background-color: initial;
    border: 0;
  }

  // Inline code
  p code {
    padding: .2em .4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27,31,35,.05);
    border-radius: 3px;
  }

  .line {
    margin-top: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid #CCC;
  }

  .finePrint {
    font-size: 14px;
  }

  .acknowledgments {
    margin-top: 10px;
  }

  .filterList {
    margin-top: 10px;
    line-height: 1.0;
  }

  .imageContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
  }

  img {
    margin-left: 30px;
    margin-right: 30px;
    margin-top: 2px;
    margin-bottom: 2px;
  }

`;

export const getAcknowledgments = (metadata, dispatch) => {
  /**
   * If the metadata contains a description key, then it will take precendence the hard-coded
   * acknowledgements. Expects the text in the description to be in Mardown format.
   * Jover. December 2019.
  */
  if (metadata.description) {
    dompurify.addHook("afterSanitizeAttributes", (node) => {
      // Set external links to open in a new tab
      if ('href' in node && location.hostname !== node.hostname) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noreferrer nofollow');
      }
      // Find nodes that contain images and add imageContainer class to update styling
      const nodeContainsImg = ([...node.childNodes].filter((child) => child.localName === 'img')).length > 0;
      if (nodeContainsImg) {
        // For special case of image links, set imageContainer on outer parent
        if (node.localName === 'a') {
          node.parentNode.className += ' imageContainer';
        } else {
          node.className += ' imageContainer';
        }
      }
    });

    const sanitizer = dompurify.sanitize;
    const sanitizerConfig = {
      ALLOWED_TAGS: ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'del', 'ol', 'ul', 'li', 'a', 'img', '#text', 'code', 'pre', 'hr'],
      ALLOWED_ATTR: ['href', 'src', 'width', 'height', 'alt'],
      KEEP_CONTENT: false,
      ALLOW_DATA_ATTR: false
    };

    let cleanDescription;
    try {
      const rawDescription = marked(metadata.description);
      cleanDescription = sanitizer(rawDescription, sanitizerConfig);
    } catch (error) {
      console.error(`Error parsing footer description: ${error}`);
      cleanDescription = '<p>There was an error parsing the footer description.</p>';
    }

    return (
      <div
        className='acknowledgments'
        dangerouslySetInnerHTML={{ __html: cleanDescription }} // eslint-disable-line react/no-danger
      />
    );
  }

  const preambleContent = "This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions.";
  const genericPreamble = (<div>{preambleContent}</div>);

  if (window.location.hostname === 'nextstrain.org') {
    return hardCodedFooters(dispatch, genericPreamble);
  }

  return (<div>{genericPreamble}</div>);

};

const dispatchFilter = (dispatch, activeFilters, key, value) => {
  const mode = activeFilters[key].indexOf(value) === -1 ? "add" : "remove";
  dispatch(applyFilter(mode, key, [value]));
};

export const displayFilterValueAsButton = (dispatch, activeFilters, filterName, itemName, display, showX) => {
  const active = activeFilters[filterName].indexOf(itemName) !== -1;
  if (active && showX) {
    return (
      <div key={itemName} style={{display: "inline-block"}}>
        <div
          className={'boxed-item-icon'}
          onClick={() => {dispatchFilter(dispatch, activeFilters, filterName, itemName);}}
          role="button"
          tabIndex={0}
        >
          {'\xD7'}
        </div>
        <div className={"boxed-item active-with-icon"}>
          {display}
        </div>
      </div>
    );
  }
  if (active) {
    return (
      <div
        className={"boxed-item active-clickable"}
        key={itemName}
        onClick={() => {dispatchFilter(dispatch, activeFilters, filterName, itemName);}}
        role="button"
        tabIndex={0}
      >
        {display}
      </div>
    );
  }
  return (
    <div
      className={"boxed-item inactive"}
      key={itemName}
      onClick={() => {dispatchFilter(dispatch, activeFilters, filterName, itemName);}}
      role="button"
      tabIndex={0}
    >
      {display}
    </div>
  );
};

const removeFiltersButton = (dispatch, filterNames, outerClassName, label) => {
  return (
    <div
      className={`${outerClassName} boxed-item active-clickable`}
      style={{paddingLeft: '5px', paddingRight: '5px', display: "inline-block"}}
      onClick={() => {
        filterNames.forEach((n) => dispatch(applyFilter("set", n, [])));
      }}
    >
      {label}
    </div>
  );
};

@connect((state) => {
  return {
    tree: state.tree,
    totalStateCounts: state.tree.totalStateCounts,
    metadata: state.metadata,
    colorOptions: state.metadata.colorOptions,
    browserDimensions: state.browserDimensions.browserDimensions,
    activeFilters: state.controls.filters
  };
})
class Footer extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.tree.version !== nextProps.tree.version ||
    this.props.browserDimensions !== nextProps.browserDimensions) {
      return true;
    } else if (Object.keys(this.props.activeFilters) !== Object.keys(nextProps.activeFilters)) {
      return true;
    } else if (Object.keys(this.props.activeFilters)) {
      for (const name of this.props.activeFilters) {
        if (this.props.activeFilters[name] !== nextProps.activeFilters[name]) {
          return true;
        }
      }
    }
    return false;
  }

  displayFilter(filterName) {
    const { t } = this.props;
    const totalStateCount = this.props.totalStateCounts[filterName];
    const filterTitle = this.props.metadata.colorings[filterName] ? this.props.metadata.colorings[filterName].title : filterName;
    return (
      <div>
        {t("Filter by {{filterTitle}}", {filterTitle: filterTitle})}
        {this.props.activeFilters[filterName].length ? removeFiltersButton(this.props.dispatch, [filterName], "inlineRight", t("Clear {{filterName}} filter", { filterName: filterName})) : null}
        <div className='filterList'>
          <Flex wrap="wrap" justifyContent="flex-start" alignItems="center">
            {
              Array.from(totalStateCount.keys())
                .filter((itemName) => isValueValid(itemName)) // remove invalid values present across the tree
                .sort() // filters are sorted alphabetically
                .map((itemName) => {
                  const display = (
                    <span>
                      {`${itemName} (${totalStateCount.get(itemName)})`}
                    </span>
                  );
                  return displayFilterValueAsButton(this.props.dispatch, this.props.activeFilters, filterName, itemName, display, false);
                })
            }
          </Flex>
        </div>
      </div>
    );
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
  getCitation() {
    return (
      <span>
        {"Nextstrain: "}
        <a href={publications.nextstrain.href} target="_blank" rel="noopener noreferrer">
          {publications.nextstrain.author}, <i>{publications.nextstrain.journal}</i>{` (${publications.nextstrain.year})`}
        </a>
      </span>
    );
  }

  render() {
    if (!this.props.metadata || !this.props.tree.nodes) return null;
    const width = this.props.width - 30; // need to subtract margin when calculating div width
    return (
      <FooterStyles>
        <div style={{width: width}}>
          <div className='line'/>
          {getAcknowledgments(this.props.metadata, this.props.dispatch)}
          <div className='line'/>
          {Object.keys(this.props.activeFilters).map((name) => {
            return (
              <div key={name}>
                {this.displayFilter(name)}
                <div className='line'/>
              </div>
            );
          })}
          <Flex className='finePrint'>
            {this.getUpdated()}
            {dot}
            {this.downloadDataButton()}
            {dot}
            {"Auspice v" + version}
          </Flex>
          <div style={{height: "3px"}}/>
          <Flex className='finePrint'>
            {this.getCitation()}
          </Flex>
        </div>
      </FooterStyles>
    );
  }
}

// {dot}
//

const WithTranslation = withTranslation()(Footer);
export default WithTranslation;
