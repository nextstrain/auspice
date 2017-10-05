import React from "react";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { applyFilterQuery, changeDateFilter } from "../../actions/treeProperties";
import { prettyString } from "../../util/stringHelpers";
import { displayFilterValueAsButton } from "../framework/footer";
import { getValuesAndCountsOfTraitFromTree } from "../../util/getColorScale";
import { CHANGE_TREE_ROOT_IDX } from "../../actions/types";

const resetTreeButton = (dispatch) => {
  return (
    <div
      className={`boxed-item active-clickable`}
      style={{paddingLeft: '5px', paddingRight: '5px', display: "inline-block"}}
      onClick={() => dispatch({type: CHANGE_TREE_ROOT_IDX, idxOfInViewRootNode: 0})}
    >
      {"View Entire Tree."}
    </div>
  );
};

const months = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December'
};

const styliseDateRange = (dateStr) => {
  // 2012-01-22
  const fields = dateStr.split('-');
  return `${months[fields[1]]} ${fields[0]}`;
};

@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions,
    filters: state.controls.filters,
    mapAnimationPlayPauseButton: state.controls.mapAnimationPlayPauseButton,
    metadata: state.metadata.metadata,
    nodes: state.tree.nodes,
    idxOfInViewRootNode: state.tree.idxOfInViewRootNode,
    visibility: state.tree.visibility,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax
  };
})
class Info extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    sidebar: React.PropTypes.bool.isRequired,
    filters: React.PropTypes.object.isRequired,
    metadata: React.PropTypes.object, // not required. starts as null
    nodes: React.PropTypes.array, // not required. starts as null
    visibility: React.PropTypes.array, // not required. starts as null
    dispatch: React.PropTypes.func.isRequired,
    idxOfInViewRootNode: React.PropTypes.number
  }


  getStyles(responsive) {
    let fontSize = 32;
    if (this.props.browserDimensions.width < 1000) {
      fontSize = 30;
    }
    if (this.props.browserDimensions.width < 800) {
      fontSize = 28;
    }
    if (this.props.browserDimensions.width < 600) {
      fontSize = 26;
    }
    if (this.props.browserDimensions.width < 400) {
      fontSize = 24;
    }
    return {
      title: {
        fontFamily: titleFont,
        fontSize: fontSize,
        marginLeft: 5,
        marginTop: 0,
        marginBottom: 5,
        fontWeight: 300,
        color: darkGrey,
        letterSpacing: "-1px",
        maxWidth: responsive.width
      },
      n: {
        fontFamily: headerFont,
        fontSize: 14,
        lineHeight: 1.4,
        marginLeft: 10,
        marginTop: 5,
        marginBottom: 5,
        fontWeight: 500,
        color: medGrey
      }
    };
  }

  getNumSelectedAuthors() {
    if (!Object.prototype.hasOwnProperty.call(this.props.filters, "authors") || this.props.filters.authors.length === 0) {
      return Object.keys(this.props.metadata.author_info).length;
    }
    return this.props.filters.authors.length;
  }
  getNumSelectedTips() {
    let count = 0;
    this.props.nodes.forEach((d, idx) => {
      if (!d.hasChildren && this.props.visibility[idx] === "visible") count += 1;
    });
    return count;
  }
  summariseNonAuthorFilter(filterName) {
    const stateCount = getValuesAndCountsOfTraitFromTree(this.props.nodes, filterName);
    if (!this.props.filters[filterName].length) {
      return `n(${prettyString(filterName)}): ${Object.keys(stateCount).length}. `;
    }
    return (
      <g key={filterName}>
        {`${prettyString(filterName)} is restricted to: `}
        {this.props.filters[filterName].sort().map((itemName) => {
          const display = (
            <g>
              {prettyString(itemName)}
              {" (" + stateCount[itemName] + ")"}
            </g>
          );
          return displayFilterValueAsButton(this.props.dispatch, this.props.filters, filterName, itemName, display, true);
        })}
        {`. `}
      </g>
    );
  }
  clearFilterButton(field) {
    return (
      <span
        style={{cursor: "pointer", color: '#5097BA'}}
        key={field}
        onClick={() => this.props.dispatch(applyFilterQuery(field, []))}
        role="button"
        tabIndex={0}
      >
        {field}
      </span>
    );
  }
  summariseSelectedAuthors() {
    if (!this.props.metadata.author_info) {return null;}
    const nTotalAuthors = Object.keys(this.props.metadata.author_info).length;
    const nSelectedAuthors = this.getNumSelectedAuthors(); // will be equal to nTotalAuthors if none selected

    const authorInfo = this.props.filters.authors.map((v) => ({
      name: v,
      label: (
        <g>
          {prettyString(v, {stripEtAl: true})}
          {" et al (n=" + this.props.metadata.author_info[v].n + ")"}
        </g>
      ),
      longlabel: (
        <g>
          {prettyString(v, {stripEtAl: true})}
          {" et al "}
          {prettyString(this.props.metadata.author_info[v].title)}
          {" (n=" + this.props.metadata.author_info[v].n + ")"}
        </g>
      )
    }));
    /* case 1 (no selected authors) has already been handled */
    if (nTotalAuthors === nSelectedAuthors) {
      return `Data from ${nTotalAuthors} publications. `;
    }
    /* case 2: a single author selected */
    if (nSelectedAuthors > 0 && nSelectedAuthors < 3) {
      return (
        <g>
          {"Data from "}
          {authorInfo.map((d) => (
            displayFilterValueAsButton(this.props.dispatch, this.props.filters, "authors", d.name, d.longlabel, true)
          ))}
          {". "}
        </g>
      );
    }
    /* case 3: more than one author selected. */
    return (
      <g>
        {"Data from "}
        {authorInfo.map((d) => (
          displayFilterValueAsButton(this.props.dispatch, this.props.filters, "authors", d.name, d.label, true)
        ))}
        {". "}
      </g>
    );
  }

  render() {
    if (!this.props.metadata || !this.props.nodes || !this.props.visibility) return null;
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: 1.0,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar,
      minHeight: 480,
      maxAspectRatio: 1.0
    });
    const styles = this.getStyles(responsive);
    const nTotalSamples = this.props.metadata.virus_count;
    const nSelectedSamples = this.getNumSelectedTips();
    const filtersWithValues = Object.keys(this.props.filters).filter((n) => this.props.filters[n].length > 0);
    const animating = this.props.mapAnimationPlayPauseButton === "Pause";
    const datesMaxed = this.props.dateMin === this.props.absoluteDateMin && this.props.dateMax === this.props.absoluteDateMax;
    let title = "";
    if (this.props.metadata.title) {
      title = this.props.metadata.title;
    }
    return (
      <Card center infocard>
        <div style={{width: responsive.width+34, display: "inline-block"}}>
          <div width={responsive.width} style={styles.title}>
            {title}
          </div>
          <div width={responsive.width} style={styles.n}>
            {animating ? `Map animation in progress. ` : `Showing ${nSelectedSamples} of ${nTotalSamples} genomes. `}
            {/* Author filters */}
            {this.summariseSelectedAuthors()}
            {/* Summarise other filters */}
            {Object.keys(this.props.filters)
              .filter((n) => n !== "authors")
              // .filter((n) => this.props.filters[n].length > 0)
              .map((n) => this.summariseNonAuthorFilter(n))
            }
            {/* dates restricted? */}
            { animating ? '' :
              datesMaxed ?
                `Data sampled between ${styliseDateRange(this.props.absoluteDateMin)} & ${styliseDateRange(this.props.absoluteDateMax)}. ` :
                this.props.dateMin !== this.props.absoluteDateMin && this.props.dateMax !== this.props.absoluteDateMax ?
                  `Date restricted to between ${styliseDateRange(this.props.dateMin)} & ${styliseDateRange(this.props.dateMax)}. ` :
                  this.props.dateMin !== this.props.absoluteDateMin ?
                    `Restriced to sequences after ${styliseDateRange(this.props.dateMin)}. ` :
                    `Restriced to sequences before ${styliseDateRange(this.props.dateMax)}. `
            }
            {/* Button to clear all filters (when applicable) */}
            {!animating && (filtersWithValues.length || !datesMaxed) ? (
              <div
                className={`boxed-item active-clickable`}
                style={{paddingLeft: '5px', paddingRight: '5px', display: "inline-block"}}
                onClick={() => {
                  if (filtersWithValues.length) {
                    filtersWithValues.forEach((n) => this.props.dispatch(applyFilterQuery(n, [], 'set')));
                  }
                  if (this.props.dateMin !== this.props.absoluteDateMin || this.props.dateMax !== this.props.absoluteDateMax) {
                    this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax}));
                  }
                }}
              >
                {"Reset all filters"}
              </div>
            ) : null}
            {/* branch selected message? (and button) */}
            {this.props.idxOfInViewRootNode === 0 ? null :
              `Currently viewing a clade with ${this.props.nodes[this.props.idxOfInViewRootNode].fullTipCount} descendants. `}
            {this.props.idxOfInViewRootNode === 0 ? null : resetTreeButton(this.props.dispatch)}
          </div>
        </div>
      </Card>
    );
  }
}
// from ${nSelectedAuthors} `}
// {nTotalAuthors === nSelectedAuthors ? "publications. " : `out of ${nTotalAuthors} publications. `}
export default Info;
