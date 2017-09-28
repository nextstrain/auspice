import React from "react";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { twoColumnBreakpoint } from "../../util/globals";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { applyFilterQuery } from "../../actions/treeProperties";
import { prettyString } from "../../util/stringHelpers";
import { displayFilterValueAsButton, removeFiltersButton } from "../framework/footer";
import Toggle from "../controls/toggle";
import { getValuesAndCountsOfTraitFromTree } from "../../util/getColorScale";

const areAnyFiltersActive = (filters) => {
  return !!Object.keys(filters).filter((d) => filters[d].length > 0).length;
};

@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions,
    filters: state.controls.filters,
    metadata: state.metadata.metadata,
    nodes: state.tree.nodes,
    visibility: state.tree.visibility
  };
})
class Info extends React.Component {
  constructor(props) {
    super(props);
    this.state = {expanded: false};
  }
  componentWillReceiveProps(nextProps) {
    if (!this.state.expanded && areAnyFiltersActive(nextProps.filters)) {
      this.setState({expanded: true});
    }
  }
  static propTypes = {
    sidebar: React.PropTypes.bool.isRequired,
    filters: React.PropTypes.object.isRequired,
    metadata: React.PropTypes.object, // not required. starts as null
    nodes: React.PropTypes.array, // not required. starts as null
    visibility: React.PropTypes.array, // not required. starts as null
    dispatch: React.PropTypes.func.isRequired
  }

  getStyles(responsive) {
    let fontSize = 36;
    if (this.props.browserDimensions.width < 1000) {
      fontSize = 32;
    }
    if (this.props.browserDimensions.width < 800) {
      fontSize = 28;
    }
    if (this.props.browserDimensions.width < 600) {
      fontSize = 24;
    }
    if (this.props.browserDimensions.width < 400) {
      fontSize = 24;
    }
    return {
      title: {
        fontFamily: titleFont,
        fontSize: fontSize,
        marginLeft: 5,
        marginTop: 5,
        marginBottom: 10,
        fontWeight: 300,
        color: darkGrey,
        letterSpacing: "-1px",
        maxWidth: responsive.width - 50
      },
      titleSmall: {
        fontFamily: titleFont,
        fontSize: 18,
        marginLeft: 5,
        marginTop: 0,
        marginBottom: 4,
        fontWeight: 300,
        color: darkGrey,
        maxWidth: responsive.width - 50
      },
      n: {
        fontFamily: headerFont,
        fontSize: 15,
        lineHeight: 1.4,
        marginLeft: 10,
        marginTop: 5,
        marginBottom: 10,
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
      title: prettyString(this.props.metadata.author_info[v].title)
    }));
    /* case 1 (no selected authors) has already been handled */
    if (nTotalAuthors === nSelectedAuthors) {
      return null;
    }
    /* case 2: a single author selected */
    if (nSelectedAuthors === 1) {
      return (
        <g>
          {"Data from "}
          {displayFilterValueAsButton(this.props.dispatch, this.props.filters, "authors", authorInfo[0].name, authorInfo[0].label, true)}
          <span style={{fontWeight: 300}}>{`"${authorInfo[0].title}". `}</span>
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
        {`. `}
      </g>
    );
  }

  toggle() {
    return (
      <Toggle
        display
        on={this.state.expanded}
        callback={() => {this.setState({expanded: !this.state.expanded});}}
        label=""
      />
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
    const title = this.props.metadata.title ? this.props.metadata.title : "";
    const nTotalSamples = this.props.metadata.virus_count;
    const nSelectedSamples = this.getNumSelectedTips();
    const filtersWithValues = Object.keys(this.props.filters).filter((n) => this.props.filters[n].length > 0);
    return (
      <Card center>
        <div style={{width: responsive.width, display: "inline-block"}}>
          <Toggle
            display
            on={this.state.expanded}
            style={{
              position: "absolute",
              marginTop: 0,
              paddingLeft: responsive.width - 40
            }}
            callback={() => {this.setState({expanded: !this.state.expanded});}}
            label=""
          />
          <div width={responsive.width} style={this.state.expanded ? styles.title : styles.titleSmall}>
            {title}
          </div>
          {this.state.expanded ? (
            <div width={responsive.width} style={styles.n}>
              {`Showing ${nSelectedSamples} of ${nTotalSamples} genomes. `}
              {/* Author filters */}
              {this.summariseSelectedAuthors()}
              {/* Summarise other filters */}
              {Object.keys(this.props.filters)
                .filter((n) => n !== "authors")
                .filter((n) => this.props.filters[n].length > 0)
                .map((n) => this.summariseNonAuthorFilter(n))
              }
              {/* Clear all filters (if applicable!) */}
              {filtersWithValues.length ?
                removeFiltersButton(this.props.dispatch, filtersWithValues, "", "Remove all filters.") :
                null
              }
            </div>
          ) : null}
        </div>
      </Card>
    );
  }
}
// from ${nSelectedAuthors} `}
// {nTotalAuthors === nSelectedAuthors ? "publications. " : `out of ${nTotalAuthors} publications. `}
export default Info;
