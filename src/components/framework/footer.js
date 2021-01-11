import React, { Suspense, lazy } from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import { withTranslation } from "react-i18next";
import { dataFont } from "../../globalStyles";
import Flex from "./flex";
import { applyFilter } from "../../actions/tree";
import { isValueValid } from "../../util/globals";
import hardCodedFooters from "./footer-descriptions";
import { SimpleFilter } from "../info/filterBadge";

const MarkdownDisplay = lazy(() => import("../markdownDisplay"));

const FooterStyles = styled.div`
  margin-left: 30px;
  padding-bottom: 0px;
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
    return (
      <Suspense fallback={<div />}>
        <MarkdownDisplay className="acknowledgments" mdstring={metadata.description} />
      </Suspense>
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
  const activeValuesOfFilter = activeFilters[key].map((f) => f.value);
  const mode = activeValuesOfFilter.indexOf(value) === -1 ? "add" : "remove";
  dispatch(applyFilter(mode, key, [value]));
};

const removeFiltersButton = (dispatch, filterNames, outerClassName, label) => (
  <SimpleFilter
    active
    extraStyles={{float: "right", margin: "0px 4px"}}
    onClick={() => {filterNames.forEach((n) => dispatch(applyFilter("set", n, [])));}}
  >
    {label}
  </SimpleFilter>
);


@connect((state) => {
  return {
    tree: state.tree,
    totalStateCounts: state.tree.totalStateCounts,
    metadata: state.metadata,
    colorOptions: state.metadata.colorOptions,
    browserDimensions: state.browserDimensions.browserDimensions,
    activeFilters: state.controls.filters,
    filtersInFooter: state.controls.filtersInFooter
  };
})
class Footer extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (this.props.tree.version !== nextProps.tree.version ||
    this.props.browserDimensions !== nextProps.browserDimensions) {
      return true;
    } else if (Object.keys(this.props.activeFilters) !== Object.keys(nextProps.activeFilters)) {
      return true;
    } else if (Object.keys(this.props.activeFilters).length > 0) {
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
    const activeFilterItems = this.props.activeFilters[filterName].filter((x) => x.active).map((x) => x.value);
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
                .map((itemName) => (
                  <SimpleFilter
                    key={itemName}
                    active={activeFilterItems.indexOf(itemName) !== -1}
                    onClick={() => dispatchFilter(this.props.dispatch, this.props.activeFilters, filterName, itemName)}
                  >
                    <span>
                      {`${itemName} (${totalStateCount.get(itemName)})`}
                    </span>
                  </SimpleFilter>
                ))
            }
          </Flex>
        </div>
      </div>
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
          {Object.keys(this.props.activeFilters)
            .filter((name) => this.props.filtersInFooter.includes(name))
            .map((name) => {
              return (
                <div key={name}>
                  {this.displayFilter(name)}
                  <div className='line'/>
                </div>
              );
            })}
        </div>
      </FooterStyles>
    );
  }
}

const WithTranslation = withTranslation()(Footer);
export default WithTranslation;
