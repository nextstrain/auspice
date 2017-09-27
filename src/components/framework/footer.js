import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { dataFont, medGrey, materialButton } from "../../globalStyles";
import { prettyString } from "../../util/stringHelpers";
import computeResponsive from "../../util/computeResponsive";
import { TRIGGER_DOWNLOAD_MODAL } from "../../actions/types";
import Flex from "./flex";
import { applyFilterQuery } from "../../actions/treeProperties";
import { getValuesAndCountsOfTraitFromTree } from "../../util/getColorScale";

const dot = (
  <span style={{marginLeft: 10, marginRight: 10}}>
    •
  </span>
);

@connect((state) => {
  return {
    tree: state.tree,
    metadata: state.metadata.metadata,
    colorOptions: state.metadata.colorOptions,
    browserDimensions: state.browserDimensions.browserDimensions,
    activeFilters: state.controls.filters
  };
})
class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.getStyles = () => {
      /* the styles of the individual items is set in CSS */
      const styles = {
        footer: {
          textAlign: "justify",
          marginLeft: "30px",
          // marginBottom: "30px",
          // padding: "0px",
          paddingBottom: "30px",
          fontFamily: dataFont,
          fontSize: 15,
          fontWeight: 300,
          color: medGrey
        },
        citationList: {
          marginTop: "10px"
        },
        line: {
          marginTop: "20px",
          marginBottom: "20px",
          borderBottom: "1px solid #CCC"
        },
        fineprint: {
          fontSize: 14
        }
      };
      return styles;
    };
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
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

  filter(key, value) {
    const mode = this.props.activeFilters[key].indexOf(value) === -1 ? "add" : "remove";
    this.props.dispatch(applyFilterQuery(key, [value], mode));
  }

  displayClearAllButton(filterName, outerClassName) {
    return (
      <div className={outerClassName}>
        <div
          className={'select-item-icon'}
          onClick={() => {this.props.dispatch(applyFilterQuery(filterName, [], 'set'));}}
          role="button"
          tabIndex={0}
        >
          {'\xD7'}
        </div>
        <div className={"select-item active"} style={{paddingLeft: '5px', paddingRight: '5px'}}>
          clear all
        </div>
      </div>
    );
  }
  displayFilterValueAsButton(styles, filterName, itemName, display) {
    const active = this.props.activeFilters[filterName].indexOf(itemName) !== -1;
    if (active) {
      return (
        <div key={itemName}>
          <div
            className={'select-item-icon'}
            onClick={() => {this.filter(filterName, itemName);}}
            role="button"
            tabIndex={0}
          >
            {'\xD7'}
          </div>
          <div className={"select-item active"}>
            {display}
          </div>
        </div>
      );
    }
    return (
      <div
        className={"select-item inactive"}
        key={itemName}
        onClick={() => {this.filter(filterName, itemName);}}
        role="button"
        tabIndex={0}
      >
        {display}
      </div>
    );
  }

  displayFilter(styles, filterName) {
    const stateCount = getValuesAndCountsOfTraitFromTree(this.props.tree.nodes, filterName);
    return (
      <div>
        {`Filter on ${prettyString(filterName)}`}
        {this.props.activeFilters[filterName].length ? this.displayClearAllButton(filterName, "inlineRight") : null}
        <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
          {Object.keys(stateCount).sort().map((itemName) => {
            const display = (
              <g>
                {prettyString(itemName)}
                {" (" + stateCount[itemName] + ")"}
              </g>
            );
            return this.displayFilterValueAsButton(styles, filterName, itemName, display);
          })}
        </Flex>
      </div>
    );
  }
  getAdditionalDatasetSpecificInfo(styles) {
    if (this.context.router.history.location.pathname.includes("ebola")) {
      return (
        <div style={styles.citationList}>
          For a more complete phylogeographic analysis of these data see <a target="_blank" rel="noreferrer noopener" href="http://dx.doi.org/10.1038/nature22040">Dudas et al</a>. Curated data used in the paper are available at <a target="_blank" rel="noreferrer noopener" href="https://github.com/ebov/space-time">github.com/ebov/space-time</a>. The animation shown here was inspired by <a target="_blank" rel="noreferrer noopener" href="https://youtu.be/eWnIhWUpQiQ">a work</a> by <a target="_blank" rel="noreferrer noopener" href="http://bedford.io/team/gytis-dudas/">Gytis Dudas</a>.
        </div>
      );
    }
    return null;
  }

  getUpdated() {
    let updated = null;
    if (this.props.metadata) {
      if (this.props.metadata.updated) {
        updated = this.props.metadata.updated;
      }
    }
    if (!updated) return null;
    return (
      <span>Data updated {updated}</span>
    );
  }
  downloadDataButton() {
    return (
      <button
        style={Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)", margin: 0, padding: 0})}
        onClick={() => { this.props.dispatch({ type: TRIGGER_DOWNLOAD_MODAL }); }}
      >
        <span style={{position: "relative"}}>{"DOWNLOAD DATA"}</span>
      </button>
    );
  }
  getMaintainer() {
    if (Object.prototype.hasOwnProperty.call(this.props.metadata, "maintainer")) {
      return (
        <span>
          dataset maintained by <a href={this.props.metadata.maintainer[1]} target="_blank">{this.props.metadata.maintainer[0]}</a>
        </span>
      );
    }
    return null;
  }
  authorInfoAndFilter(styles) {
    let preamble = "This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions.";
    if (this.context.router.history.location.pathname.includes("avian") || this.context.router.history.location.pathname.includes("flu")) {
      preamble = (
        <div>
          This work is made possible by the open sharing of genetic data by research groups from all over the world via <a href="http://platform.gisaid.org/">GISAID</a>. We gratefully acknowledge their contributions.
        </div>
      );
    }
    /* if we don't have authors in the filters (keys) then nothing to display */
    if (Object.keys(this.props.activeFilters).indexOf("authors") === -1) {
      return preamble;
    }
    const author_info = this.props.metadata.author_info;
    return (
      <div>
        {preamble}
        {this.props.activeFilters.authors.length ? this.displayClearAllButton("authors", "inlineRight") : null}
        <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
          {Object.keys(author_info).sort().map((authorName) => {
            const display = (
              <g>
                {prettyString(authorName, {stripEtAl: true})}
                {" et al (" + author_info[authorName].n + ")"}
              </g>
            );
            return this.displayFilterValueAsButton(styles, "authors", authorName, display);
          })}
        </Flex>
      </div>
    );
  }

  render() {
    if (!this.props.metadata || !this.props.tree.nodes) return null;
    const styles = this.getStyles();
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: 0.3333333,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    });
    const width = responsive.width - 30; // need to subtract margin when calculating div width
    return (
      <div style={styles.footer}>
        <div style={{width: width}}>
          <div style={styles.line}/>
          {this.authorInfoAndFilter(styles)}
          {this.getAdditionalDatasetSpecificInfo(styles)}
          <div style={styles.line}/>
          {Object.keys(this.props.activeFilters).map((name) => {
            if (name === "authors") {return null;}
            return (
              <div key={name}>
                {this.displayFilter(styles, name)}
                <div style={styles.line}/>
              </div>
            );
          })}
          <Flex style={styles.fineprint}>
            {this.getUpdated()}
            {dot}
            {this.downloadDataButton()}
            {dot}
            {this.getMaintainer()}
          </Flex>
        </div>
      </div>
    );
  }
}

export default Footer;
