import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';

import Card from "../framework/card";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { applyFilter, changeDateFilter, updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";
import { getVisibleDateRange } from "../../util/treeVisibilityHelpers";
import { numericToCalendar } from "../../util/dateHelpers";
import { months, NODE_VISIBLE } from "../../util/globals";
import { displayFilterValueAsButton } from "../framework/footer";
import Byline from "./byline";


const plurals = {
  country: "countries",
  authors: "authors"
};

const pluralise = (word, n) => {
  if (n === 1) {
    if (word === "authors") word = "author"; // eslint-disable-line
  } else {
    if (word in plurals) word = plurals[word]; // eslint-disable-line
    if (word.slice(-1).toLowerCase() !== "s") word+="s"; // eslint-disable-line
  }
  word = word.replace(/_/g, " "); // eslint-disable-line
  return word;
};

const styliseDateRange = (date) => {
  const dateStr = (typeof date === "number") ?
    numericToCalendar(date) :
    date;
  const fields = dateStr.split('-');
  // 2012-01-22
  if (fields.length === 3) {
    return `${months[fields[1]]} ${fields[0]}`;
  }
  // other cases like negative numbers
  return dateStr;
};

export const getNumSelectedTips = (nodes, visibility) => {
  let count = 0;
  nodes.forEach((d, idx) => {
    // nodes which are not inView have a visibility of NODE_NOT_VISIBLE
    // so this check accounts for them as well
    if (!d.hasChildren && visibility[idx] === NODE_VISIBLE) count += 1;
  });
  return count;
};

const arrayToSentence = (arr, {prefix=undefined, suffix=undefined, capatalise=true, fullStop=true}={}) => {
  let ret;
  if (!arr.length) return '';
  if (arr.length === 1) {
    ret = arr[0];
  } else {
    ret = arr.slice(0, -1).join(", ") + " and " + arr[arr.length-1];
  }
  if (prefix) ret = prefix + " " + ret;
  if (suffix) ret += " " + suffix;
  if (capatalise) ret = ret.charAt(0).toUpperCase();
  if (fullStop) ret += ".";
  return ret + " ";
};

export const createSummary = (mainTreeNumTips, nodes, filters, visibility, visibleStateCounts, branchLengthsToDisplay, t) => {
  const nSelectedSamples = getNumSelectedTips(nodes, visibility);
  const sampledDateRange = getVisibleDateRange(nodes, visibility);
  let summary = ""; /* text returned from this function */

  /* Number of genomes & their date range */
  if (branchLengthsToDisplay !== "divOnly" && nSelectedSamples > 0) {
    summary += t(
      "Showing {{x}} of {{y}} genomes sampled between {{from}} and {{to}}",
      {
        x: nSelectedSamples,
        y: mainTreeNumTips,
        from: styliseDateRange(sampledDateRange[0]),
        to: styliseDateRange(sampledDateRange[1])
      }
    );
  } else {
    summary += t(
      "Showing {{x}} of {{y}} genomes",
      {x: nSelectedSamples, y: mainTreeNumTips}
    );
  }
  summary += ".";

  /* parse filters */
  const filterTextArr = [];
  Object.keys(filters).forEach((filterName) => {
    const n = Object.keys(visibleStateCounts[filterName]).length;
    if (!n) return;
    filterTextArr.push(`${n} ${pluralise(filterName, n)}`);
  });
  const prefix = t("Comprising");
  const filterText = arrayToSentence(filterTextArr, {prefix: prefix, capatalise: false});
  if (filterText.length) {
    summary += ` ${filterText}`;
  } else if (summary.endsWith('.')) {
    summary += " ";
  } else {
    summary += ". ";
  }
  return summary;
};

@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions,
    filters: state.controls.filters,
    animationPlayPauseButton: state.controls.animationPlayPauseButton,
    metadata: state.metadata,
    nodes: state.tree.nodes,
    visibleStateCounts: state.tree.visibleStateCounts,
    totalStateCounts: state.tree.totalStateCounts,
    visibility: state.tree.visibility,
    selectedStrain: state.tree.selectedStrain,
    selectedClade: state.tree.selectedClade,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay
  };
})
class Info extends React.Component {
  constructor(props) {
    super(props);
  }
  getStyles(width) {
    let fontSize = 28;
    if (this.props.browserDimensions.width < 1000) {
      fontSize = 27;
    }
    if (this.props.browserDimensions.width < 800) {
      fontSize = 26;
    }
    if (this.props.browserDimensions.width < 600) {
      fontSize = 25;
    }
    if (this.props.browserDimensions.width < 400) {
      fontSize = 24;
    }
    return {
      base: {
        width: width + 34,
        display: "inline-block",
        maxWidth: width,
        marginTop: 0
      },
      title: {
        fontFamily: titleFont,
        fontSize: fontSize,
        marginLeft: 0,
        marginTop: 0,
        marginBottom: 5,
        fontWeight: 500,
        color: darkGrey,
        letterSpacing: "-0.5px",
        lineHeight: 1.2
      },
      n: {
        fontFamily: headerFont,
        fontSize: 14,
        marginLeft: 2,
        marginTop: 5,
        marginBottom: 5,
        fontWeight: 500,
        color: medGrey,
        lineHeight: 1.4
      }
    };
  }

  addFilteredDatesButton(buttons) {
    buttons.push(
      <div key={"timefilter"} style={{display: "inline-block"}}>
        <div
          className={'boxed-item-icon'}
          onClick={() => {
            this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax}));
          }}
          role="button"
          tabIndex={0}
        >
          {'\xD7'}
        </div>
        <div className={"boxed-item active-with-icon"}>
          {`${styliseDateRange(this.props.dateMin)} to ${styliseDateRange(this.props.dateMax)}`}
        </div>
      </div>
    );
  }
  addNonAuthorFilterButton(buttons, filterName) {
    this.props.filters[filterName].sort().forEach((itemName) => {
      const display = (
        <span>
          {itemName}
          {` (${this.props.totalStateCounts[filterName].get(itemName)})`}
        </span>
      );
      buttons.push(displayFilterValueAsButton(this.props.dispatch, this.props.filters, filterName, itemName, display, true));
    });
  }
  selectedStrainButton(strain) {
    return (
      <span>
        {"Showing a single strain "}
        <div style={{display: "inline-block"}}>
          <div
            className={'boxed-item-icon'}
            onClick={() => {
              this.props.dispatch(
                updateVisibleTipsAndBranchThicknesses({tipSelected: {clear: true}, cladeSelected: this.props.selectedClade})
              );
            }}
            role="button"
            tabIndex={0}
          >
            {'\xD7'}
          </div>
          <div className={"boxed-item active-with-icon"}>
            {strain}
          </div>
        </div>
      </span>
    );
  }
  clearFilterButton(field) {
    return (
      <span
        style={{cursor: "pointer", color: '#5097BA'}}
        key={field}
        onClick={() => this.props.dispatch(applyFilter("set", field, []))}
        role="button"
        tabIndex={0}
      >
        {field}
      </span>
    );
  }

  renderTitle(styles) {
    let title = "";
    if (this.props.metadata.title) {
      title = this.props.metadata.title;
    }
    return (
      <div width={this.props.width} style={styles.title}>
        {title}
      </div>
    );
  }

  render() {
    const { t } = this.props;
    if (!this.props.metadata || !this.props.nodes || !this.props.visibility) return null;
    const styles = this.getStyles(this.props.width);
    // const filtersWithValues = Object.keys(this.props.filters).filter((n) => this.props.filters[n].length > 0);
    const animating = this.props.animationPlayPauseButton === "Pause";
    const showExtended = !animating && !this.props.selectedStrain;
    const datesMaxed = this.props.dateMin === this.props.absoluteDateMin && this.props.dateMax === this.props.absoluteDateMax;

    /* the content is made up of two parts:
    (1) the summary - e.g. Showing 4 of 379 sequences, from 1 author, 1 country and 1 region, dated Apr 2016 to Jun 2016.
    (2) The active filters: Filtered to [[Metsky et al Zika Virus Evolution And Spread In The Americas (76)]], [[Colombia (28)]].
    */

    const summary = createSummary(
      this.props.metadata.mainTreeNumTips,
      this.props.nodes,
      this.props.filters,
      this.props.visibility,
      this.props.visibleStateCounts,
      this.props.branchLengthsToDisplay,
      this.props.t
    );

    /* part II - the active filters */
    const filters = [];
    Object.keys(this.props.filters)
      .filter((n) => this.props.filters[n].length > 0)
      .forEach((n) => this.addNonAuthorFilterButton(filters, n));
    if (!datesMaxed) {this.addFilteredDatesButton(filters);}

    return (
      <Card center infocard>
        <div style={styles.base}>
          {this.renderTitle(styles)}
          <Byline styles={styles} width={this.props.width} metadata={this.props.metadata}/>
          <div width={this.props.width} style={styles.n}>
            {animating ? t("Animation in progress") + ". " : null}
            {this.props.selectedStrain ? this.selectedStrainButton(this.props.selectedStrain) : null}
            {/* part 1 - the summary */}
            {showExtended ? summary : null}
            {/* part 2 - the filters */}
            {showExtended && filters.length ? (
              <span>
                {t("Filtered to") + " "}
                {filters.map((d) => d)}
                {". "}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }
}

const WithTranslation = withTranslation()(Info);
export default WithTranslation;
