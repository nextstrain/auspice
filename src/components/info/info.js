import React from "react";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { twoColumnBreakpoint } from "../../util/globals";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
import { applyFilterQuery } from "../../actions/treeProperties";
import { prettyString, authorString } from "../../util/stringHelpers";

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
  }
  static propTypes = {
    sidebar: React.PropTypes.bool.isRequired,
    filters: React.PropTypes.object.isRequired,
    metadata: React.PropTypes.object, // not required. starts as null
    nodes: React.PropTypes.array, // not required. starts as null
    visibility: React.PropTypes.array, // not required. starts as null
    dispatch: React.PropTypes.func.isRequired
  }

  getStyles() {
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
        maxWidth: 960
      },
      n: {
        fontFamily: headerFont,
        fontSize: 15,
        lineHeight: "28px",
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
  summariseFilters() {
    const otherFilters = Object.keys(this.props.filters)
      // .filter((n) => n !== "authors")
      .filter((n) => this.props.filters[n].length > 0);
    if (otherFilters.length === 0) return null;
    return (
      <g>
        {`${otherFilters.length} active filters (click to remove): `}
        {otherFilters.map((n) => (
          <span key={n}>{this.clearFilterButton(n)}{' // '}</span>
        ))}
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
  summariseSelectedAuthors(nSelectedAuthors) {
    const authorInfo = this.props.filters.authors.map((v) => ({
      name: authorString(v),
      n: this.props.metadata.author_info[v].n,
      title: prettyString(this.props.metadata.author_info[v].title)
    }));
    /* case 1 (no selected authors) has already been handled */
    /* case 2: a single author selected */
    if (nSelectedAuthors === 1) {
      return (<g>{"Data from "}{authorInfo[0].name}{" : \""}{authorInfo[0].title}{"\""}</g>);
    /* case 3: a "few" authors */
    } else if (nSelectedAuthors < 4) {
      return (
        <g>
          {"Data from "}
          {authorInfo.slice(0, authorInfo.length - 1).map((cv, idx) => (
            <g key={this.props.filters.authors[idx]}>
              {cv.name}{` (n=${cv.n}), `}
            </g>
          ))}
          {" and "}{authorInfo[authorInfo.length - 1].name}{` (n=${authorInfo[authorInfo.length - 1].n}).`}
        </g>
      );
    }
    /* case 4 (fallthrough) more than "a few" authors selected */
    return null;
  }

  render() {
    if (!this.props.metadata || !this.props.nodes || !this.props.visibility) return null;
    const responsive = computeResponsive({
      horizontal: this.props.browserDimensions && this.props.browserDimensions.width > twoColumnBreakpoint ? 0.5 : 1,
      vertical: 1.0,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar,
      minHeight: 480,
      maxAspectRatio: 1.0
    });
    const styles = this.getStyles();
    const title = this.props.metadata.title ? this.props.metadata.title : "";
    const nTotalSamples = this.props.metadata.virus_count;
    const nTotalAuthors = Object.keys(this.props.metadata.author_info).length;
    const nSelectedAuthors = this.getNumSelectedAuthors(); // will be equal to nTotalAuthors if none selected
    const nSelectedSamples = this.getNumSelectedTips();
    return (
      <Card center>
        <div style={{width: responsive.width, display: "inline-block"}}>
          <div width={responsive.width} style={styles.title}>
            {title}
          </div>
          <div width={responsive.width} style={styles.n}>
            {`Showing ${nSelectedSamples} out of ${nTotalSamples} viruses from ${nSelectedAuthors} `}
            {nTotalAuthors === nSelectedAuthors ? "publications" : `out of ${nTotalAuthors} publications`}
          </div>
          <div width={responsive.width} style={styles.n}>
            {nSelectedAuthors === nTotalAuthors ? null : this.summariseSelectedAuthors(nSelectedAuthors)}
          </div>
          <div width={responsive.width} style={styles.n}>
            {this.summariseFilters()}
          </div>
        </div>
      </Card>
    );
  }
}

export default Info;
