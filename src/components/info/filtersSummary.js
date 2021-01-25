import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { applyFilter, changeDateFilter } from "../../actions/tree";
import { strainSymbol, genotypeSymbol } from "../../util/globals";
import { FilterBadge, Tooltip } from "./filterBadge";
import { styliseDateRange } from "./datasetSummary";

const Intersect = ({id}) => (
  <span style={{fontSize: "2rem", padding: "0px 4px 0px 2px", cursor: 'help'}} data-tip data-for={id}>
    ∩
    <Tooltip id={id}>{`Groups of filters are combined by taking the intersect`}</Tooltip>
  </span>
);

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
class FiltersSummary extends React.Component {
  constructor(props) {
    super(props);
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
            {filterName!==strainSymbol && filterName!==genotypeSymbol && ` (${this.props.totalStateCounts[filterName].get(item.value)})`}
          </span>
        </FilterBadge>
      ]));
  }
  render() {
    const { t } = this.props;
    const filtersByCategory = [];
    Reflect.ownKeys(this.props.filters)
      .filter((filterName) => this.props.filters[filterName].length > 0)
      .forEach((filterName) => {
        const name = filterName===strainSymbol ? 'strain' : filterName===genotypeSymbol ? 'genotype' : filterName;
        filtersByCategory.push({name, badges: this.createFilterBadges(filterName)});
      });
    if (!(this.props.dateMin===this.props.absoluteDateMin && this.props.dateMax===this.props.absoluteDateMax)) {
      filtersByCategory.push({name: 'temporal', badges: [this.makeFilteredDatesButton()]});
    }
    if (!filtersByCategory.length) return null;
    return (
      <>
        {t("Filtered to") + " "}
        {filtersByCategory.map((filter, idx) => (
          <span style={{fontSize: "2rem", padding: "0px 2px"}} key={filter.name}>
            {idx!==0 && <Intersect id={'intersect'+idx}/>}
            {filter.badges.length === 1 ? null : `{`}
            {filter.badges.map(([name, badge], i) => (
              <span key={name}>
                {badge}
                {i!==filter.badges.length-1 ? ", " : null}
              </span>
            ))}
            {filter.badges.length === 1 ? null : `}`}
          </span>
        ))}
        {". "}
      </>
    );
  }
}

const WithTranslation = withTranslation()(FiltersSummary);
export default WithTranslation;
