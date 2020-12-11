import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';

import Card from "../framework/card";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { applyFilter, changeDateFilter } from "../../actions/tree";
import { getVisibleDateRange } from "../../util/treeVisibilityHelpers";
import { numericToCalendar } from "../../util/dateHelpers";
import { months, NODE_VISIBLE, strainSymbol } from "../../util/globals";
import Byline from "./byline";
import { FilterBadge, Tooltip } from "./filterBadge";

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

  makeFilteredDatesButton() {
    return ([
      'timeFilter',
      <FilterBadge
        key="timefilter"
        id="timefilter"
        remove={() => this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax}))}
      >
        {`${styliseDateRange(this.props.dateMin)} to ${styliseDateRange(this.props.dateMax)}`}
      </FilterBadge>
    ]);
  }
  createFilterBadges(filterName) {
    return this.props.filters[filterName]
      .sort((a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0)
      .map((item) => ([
        item.value,
        <FilterBadge
          key={item.value}
          id={String(item.value)}
          remove={() => {this.props.dispatch(applyFilter("remove", filterName, [item.value]));}}
          canMakeInactive
          active={item.active}
          activate={() => {this.props.dispatch(applyFilter("add", filterName, [item.value]));}}
          inactivate={() => {this.props.dispatch(applyFilter("inactivate", filterName, [item.value]));}}
        >
          <span>
            {item.value}
            {filterName!==strainSymbol && ` (${this.props.totalStateCounts[filterName].get(item.value)})`}
          </span>
        </FilterBadge>
      ]));
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

    /* part II - the filters in play (both active and inactive) */
    const filtersByCategory = [];
    Reflect.ownKeys(this.props.filters)
      .filter((filterName) => this.props.filters[filterName].length > 0)
      .forEach((filterName) => {
        filtersByCategory.push({name: filterName===strainSymbol?'strain':filterName, badges: this.createFilterBadges(filterName)});
      });
    if (!datesMaxed) {
      filtersByCategory.push({name: 'temporal', badges: [this.makeFilteredDatesButton()]});
    }

    return (
      <Card center infocard>
        <div style={styles.base}>
          {this.renderTitle(styles)}
          <Byline styles={styles} width={this.props.width} metadata={this.props.metadata}/>
          <div width={this.props.width} style={styles.n}>
            {animating ? t("Animation in progress") + ". " : null}
            {/* part 1 - the summary */}
            {showExtended ? summary : null}
            {/* part 2 - the filters */}
            {showExtended && filtersByCategory.length ? (
              <>
                {t("Filtered to") + " "}
                {filtersByCategory.map((filter, idx) => (
                  <Brackets idx={idx} badges={filter.badges} key={filter.name}/>
                ))}
                {". "}
              </>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }
}

const Intersect = ({id}) => (
  <span style={{fontSize: "2rem", padding: "0px 4px 0px 2px", cursor: 'help'}} data-tip data-for={id}>
    ∩
    <Tooltip id={id}>{`Groups of filters are combined by taking the intersect`}</Tooltip>
  </span>
);

const Brackets = ({badges, idx}) => (
  <span style={{fontSize: "2rem", padding: "0px 2px"}}>
    {idx!==0 && <Intersect id={'intersect'+idx}/>}
    {badges.length === 1 ? null : `{`}
    {badges.map(([name, badge], i) => (
      <span key={name}>
        {badge}
        {i!==badges.length-1 ? ", " : null}
      </span>
    ))}
    {badges.length === 1 ? null : `}`}
  </span>
);


const WithTranslation = withTranslation()(Info);
export default WithTranslation;
