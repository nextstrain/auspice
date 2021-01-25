import React from "react";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { applyFilter, changeDateFilter } from "../../actions/tree";
import { strainSymbol, genotypeSymbol, getAminoAcidName } from "../../util/globals";
import { FilterBadge, Tooltip } from "./filterBadge";
import { styliseDateRange, pluralise } from "./datasetSummary";
import { createFilterConstellation } from "../../util/treeVisibilityHelpers";

const Intersect = ({id}) => (
  <span style={{fontSize: "2rem", fontWeight: 300, padding: "0px 4px 0px 2px", cursor: 'help'}} data-tip data-for={id}>
    ∩
    <Tooltip id={id}>{`Groups of filters are combined by intersection`}</Tooltip>
  </span>
);
const Union = () => (
  <span style={{fontSize: "1.5rem", padding: "0px 3px 0px 2px"}}>
    ∪
  </span>
);
const openBracketBig = <span style={{fontSize: "2rem", fontWeight: 300, padding: "0px 0px 0px 2px"}}>{'{'}</span>;
const closeBracketBig = <span style={{fontSize: "2rem", fontWeight: 300, padding: "0px 2px"}}>{'}'}</span>;
const openBracketSmall = <span style={{fontSize: "1.8rem", fontWeight: 300, padding: "0px 2px"}}>{'{'}</span>;
const closeBracketSmall = <span style={{fontSize: "1.8rem", fontWeight: 300, padding: "0px 2px"}}>{'}'}</span>;


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
  createIndividualBadge({filterName, item, label, onHoverMessage}) {
    return (
      <FilterBadge
        key={item.value}
        id={String(item.value)}
        remove={() => {this.props.dispatch(applyFilter("remove", filterName, [item.value]));}}
        canMakeInactive
        onHoverMessage={onHoverMessage}
        active={item.active}
        activate={() => {this.props.dispatch(applyFilter("add", filterName, [item.value]));}}
        inactivate={() => {this.props.dispatch(applyFilter("inactivate", filterName, [item.value]));}}
      >
        {label}
      </FilterBadge>
    );
  }
  createFilterBadgesForTime() {
    return ([
      <FilterBadge
        key="timefilter"
        id="timefilter"
        onHoverMessage="Filtering to data sampled in this date range"
        remove={() => this.props.dispatch(changeDateFilter({newMin: this.props.absoluteDateMin, newMax: this.props.absoluteDateMax}))}
      >
        {`${styliseDateRange(this.props.dateMin)} to ${styliseDateRange(this.props.dateMax)}`}
      </FilterBadge>
    ]);
  }
  createFilterBadges(filterName) {
    const filterNameString = filterName===strainSymbol ? "sample" : filterName;
    const nFilterValues = this.props.filters[filterName].length;
    const onHoverMessage = nFilterValues === 1 ?
      `Filtering data to this ${filterNameString}` :
      `Filtering data to these ${nFilterValues} ${pluralise(filterNameString)}`;
    return this.props.filters[filterName]
      .sort((a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0)
      .map((item) => {
        let label = `${item.value}`;
        if (filterName!==strainSymbol) label+= ` (${this.props.totalStateCounts[filterName].get(item.value)})`;
        return this.createIndividualBadge({filterName, item, label, onHoverMessage});
      });
  }
  createFilterBadgesForGenotype() {
    const filters = this.props.filters[genotypeSymbol];
    const activeSet = new Set(filters.filter((f) => f.active).map((f) => f.value));
    const constellation = createFilterConstellation(filters.map((f) => f.value));
    return constellation.map((c) => {
      const nt = c[0]==="nuc";
      if (c[2].size===1) { // filtered to a single codon/nt at this position
        const residue = [...c[2]][0];
        const onHoverMessage = nt ?
          `Filtering to sequences with nucleotide ${residue} at base ${c[1]}` :
          `Filtering to sequences with ${getAminoAcidName(residue)} at codon ${c[1]} in ${c[0]}`;
        const label = `${c[0]} ${c[1]}${residue}`;
        const item = {active: activeSet.has(label), value: label};
        return this.createIndividualBadge({filterName: genotypeSymbol, item, label: item.value, onHoverMessage});
      }
      // filtered to multiple residues at this position using OR logic.
      const residues = [...c[2]];
      const labels = residues.map((residue) => `${c[0]} ${c[1]}${residue}`);
      const activeResidues = residues.filter((_, i) => activeSet.has(labels[i])); // active means filter is active
      const stringify = (l) => l.length>1 ? `${l.slice(0, -1).join(", ")} or ${l[l.length-1]}` : l[0];
      const onHoverMessage = nt ?
        `Filtering to sequences with nucleotides ${stringify(activeResidues)} at position ${c[1]}` :
        `Filtering to sequences with ${stringify(activeResidues.map((r) => getAminoAcidName(r)))} at codon ${c[1]} in ${c[0]}`;
      return residues.map((residue) => {
        const label = `${c[0]} ${c[1]}${residue}`;
        const item = {active: activeSet.has(label), value: label};
        return this.createIndividualBadge({filterName: genotypeSymbol, item, label: item.value, onHoverMessage});
      });
    });
  }
  render() {
    const { t } = this.props;
    // create an array of objects, with each object containing the badges for a filter category.
    // E.g. `filtersByCategory[i] = {name: "country", badges: Array<FilterBadgeComponent>`}`
    const filtersByCategory = [];
    Reflect.ownKeys(this.props.filters)
      .filter((filterName) => this.props.filters[filterName].length > 0)
      .forEach((filterName) => {
        if (filterName===strainSymbol) {
          filtersByCategory.push({name: 'sample', badges: this.createFilterBadges(strainSymbol)});
        } else if (filterName===genotypeSymbol) {
          filtersByCategory.push({name: 'genotype', badges: this.createFilterBadgesForGenotype()});
        } else {
          filtersByCategory.push({name: filterName, badges: this.createFilterBadges(filterName)});
        }
      });
    // temporal filtering is not a regular filter (i.e. this.props.filters)
    if (!(this.props.dateMin===this.props.absoluteDateMin && this.props.dateMax===this.props.absoluteDateMax)) {
      filtersByCategory.push({name: 'temporal', badges: this.createFilterBadgesForTime()});
    }
    if (!filtersByCategory.length) return null;

    return (
      <>
        {t("Filtered to") + " "}
        {filtersByCategory.map((filterCategory, idx) => {
          const multipleFilterBadges = filterCategory.badges.length > 1;
          const previousCategoriesRendered = idx!==0;

          return (
            <span style={{fontSize: "2rem", padding: "0px 2px"}} key={filterCategory.name}>
              {previousCategoriesRendered && <Intersect id={'intersect'+idx}/>}
              {multipleFilterBadges && openBracketBig} {/* multiple badges => surround with set notation */}
              {filterCategory.badges.map((badge, badgeIdx) => {
                if (Array.isArray(badge)) { // if `badge` is an array then we wish to render a set-within-a-set
                  return (
                    <span key={badge.map((b) => b.props.id).join("")}>
                      {openBracketSmall}
                      {badge.map((el, elIdx) => (
                        <span key={el.props.id}>
                          {el}
                          {elIdx!==badge.length-1 && <Union/>}
                        </span>
                      ))}
                      {closeBracketSmall}
                      {badgeIdx!==filterCategory.badges.length-1 && ", "}
                    </span>
                  );
                }
                return (
                  <span key={badge.props.id}>
                    {badge}
                    {badgeIdx!==filterCategory.badges.length-1 && ", "}
                  </span>
                );
              })}
              {multipleFilterBadges && closeBracketBig}
            </span>
          );
        })}
        {". "}
      </>
    );
  }
}

const WithTranslation = withTranslation()(FiltersSummary);
export default WithTranslation;
