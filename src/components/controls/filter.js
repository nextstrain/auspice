import React from "react";
import { connect } from "react-redux";
import AsyncSelect from "react-select/async";
import { debounce } from 'lodash';
import { controlsWidth, strainSymbol, genotypeSymbol} from "../../util/globals";
import { collectGenotypeStates } from "../../util/treeMiscHelpers";
import { applyFilter } from "../../actions/tree";
import { removeAllFieldFilters, toggleAllFieldFilters, applyMeasurementFilter } from "../../actions/measurements";
import { FilterBadge } from "../info/filterBadge";
import { customSelectStyles } from "./customSelect";
import { SidebarSubtitle } from "./styles";
import VirtualizedMenuList from "./virtualizedMenuList";

const DEBOUNCE_TIME = 200;

/**
 * <FilterData> is a (keyboard)-typing based search box intended to
 * allow users to filter samples. The filtering rules are not implemented
 * in this component, but are useful to spell out: we take the union of
 * entries within each category and then take the intersection of those unions.
 */
@connect((state) => {
  return {
    activeFilters: state.controls.filters,
    colorings: state.metadata.colorings,
    totalStateCounts: state.tree.totalStateCounts,
    canFilterByGenotype: !!state.entropy.genomeMap,
    nodes: state.tree.nodes,
    nodesSecondTree: state.treeToo?.nodes,
    totalStateCountsSecondTree: state.treeToo?.totalStateCounts,
    measurementsFieldsMap: state.measurements.collectionToDisplay?.fields,
    measurementsFiltersMap: state.measurements.collectionToDisplay?.filters,
    measurementsFilters: state.controls.measurementsFilters
  };
})
class FilterData extends React.Component {
  constructor(props) {
    super(props);
  }

  getStyles() {
    return {
      base: {
        width: controlsWidth,
        marginBottom: 0,
        fontSize: 14
      }
    };
  }
  getFilterTitle(filterName) {
    return this.props.colorings && this.props.colorings[filterName] && this.props.colorings[filterName].title || filterName;
  }
  makeOptions = () => {
    /**
     * The <Select> component needs an array of options to display (and search across). We compute this
     * by looping across each filter and calculating all valid options for each. This function runs
     * each time a filter is toggled on / off.
     */
    const options = [];

    /**
     * First set of options is from the totalStateCounts -- i.e. every node attr
     * which we know about (minus any currently selected filters). Note that we
     * can't filter the filters to those set on visible nodes, as selecting a
     * filter from outside this is perfectly fine in many situations.
     *
     * Those which are colorings appear first (and in the order defined in
     * colorings). Within each trait, the values are alphabetical
     */
    const coloringKeys = Object.keys(this.props.colorings||{});
    const unorderedTraitNames = [
      ...Object.keys(this.props.totalStateCounts),
      ...Object.keys(this.props.totalStateCountsSecondTree),
    ]
    const traitNames = [
      ...coloringKeys.filter((name) => unorderedTraitNames.includes(name)),
      ...unorderedTraitNames.filter((name) => !coloringKeys.includes(name))
    ]
    for (const traitName of traitNames) {
      const traitData = new Set([
        ...(this.props.totalStateCounts[traitName]?.keys() || []),
        ...(this.props.totalStateCountsSecondTree?.[traitName]?.keys() || []),
      ]);

      this.props.totalStateCounts[traitName];
      const traitTitle = this.getFilterTitle(traitName);
      const filterValuesCurrentlyActive = new Set((this.props.activeFilters[traitName] || []).filter((x) => x.active).map((x) => x.value));
      for (const traitValue of Array.from(traitData).sort()) {
        if (filterValuesCurrentlyActive.has(traitValue)) continue;
        options.push({
          label: `${traitTitle} → ${traitValue}`,
          value: [traitName, traitValue]
        });
      }
    }

    /**
     * Genotype filter options are numerous, they're the set of all observed
     * mutations
     */
    if (this.props.canFilterByGenotype) {
      const observedGenotypes = collectGenotypeStates(this.props.nodes); // set of "nuc:123A", "S:418K", etc
      const observedGenotypesSecondTree = this.props.nodesSecondTree ?
        collectGenotypeStates(this.props.nodesSecondTree).difference(observedGenotypes) :
        new Set();
      Array.from(observedGenotypes)
        .concat(Array.from(observedGenotypesSecondTree))
        .sort()
        .forEach((o) => {
          options.push({
            label: `genotype ${o}`,
            value: [genotypeSymbol, o]
          });
        });
    }

    /**
     * Add all (terminal) node names, calling each a "sample"
     */
    const sampleNames = this.props.nodes
      .filter((n) => !n.hasChildren)
      .map((n) => n.name);
    sampleNames.forEach((name) => {
        options.push({
          label: `sample → ${name}`,
          value: [strainSymbol, name]
        });
      });
    if (this.props.nodesSecondTree) {
      const seenNames = new Set(sampleNames);
      this.props.nodesSecondTree
        .filter((n) => !n.hasChildren && !seenNames.has(n.name))
        .forEach((n) => {
          options.push({
            label: `sample → ${n.name}`,
            value: [strainSymbol, n.name]
          });
        });
    }

    if (this.props.measurementsOn && this.props.measurementsFiltersMap && this.props.measurementsFieldsMap) {
      this.props.measurementsFiltersMap.forEach(({values}, filterField) => {
        const { title } = this.props.measurementsFieldsMap.get(filterField);
        values.forEach((value) => {
          options.push({
            _type: "measurements", // custom field to differentiate measurements filters
            label: `(M) ${title} → ${value}`,
            value: [filterField, value]
          });
        });
      });
    }
    return options;
  }
  selectionMade = (sel) => {
    // Process measurement filters separately than tree filters
    if (sel._type === "measurements") {
      return this.props.dispatch(applyMeasurementFilter(sel.value[0], sel.value[1], true));
    }
    return this.props.dispatch(applyFilter("add", sel.value[0], [sel.value[1]]));
  }
  summariseFilters = () => {
    const filterNames = Reflect.ownKeys(this.props.activeFilters)
      .filter((filterName) => this.props.activeFilters[filterName].length > 0);
    return filterNames.map((filterName) => {
      const n = this.props.activeFilters[filterName].filter((f) => f.active).length;
      return {
        filterName,
        displayName: filterBadgeDisplayName(n, this.getFilterTitle(filterName)),
        anyFiltersActive: () => this.props.activeFilters[filterName].filter((f) => f.active).length>0,
        remove: () => {this.props.dispatch(applyFilter("set", filterName, []));},
        activate: () => {this.props.dispatch(applyFilter("add", filterName, this.props.activeFilters[filterName].map((f) => f.value)));},
        inactivate: () => {this.props.dispatch(applyFilter("inactivate", filterName, this.props.activeFilters[filterName].map((f) => f.value)));}
      };
    });
  }
  summariseMeasurementsFilters = () => {
    if (this.props.measurementsFieldsMap === undefined) return [];
    return Object.entries(this.props.measurementsFilters).map(([field, valuesMap]) => {
      const activeFiltersCount = Array.from(valuesMap.values()).reduce((prevCount, currentValue) => {
        return currentValue.active ? prevCount + 1 : prevCount;
      }, 0);
      return {
        field,
        activeFiltersCount,
        badgeTitle: `${activeFiltersCount} x ${this.props.measurementsFieldsMap.get(field).title}`
      };
    });
  }
  render() {
    // options only need to be calculated a single time per render, and by adding a debounce
    // to `loadOptions` we don't slow things down by comparing queries to a large number of options
    const options = this.makeOptions();
    const loadOptions = debounce((input, callback) => callback(options), DEBOUNCE_TIME);
    const filterOption = (option, filter) => filter.toLowerCase().split(" ").every((word) => option.label.toLowerCase().includes(word));
    const styles = this.getStyles();
    const inUseFilters = this.summariseFilters();
    const measurementsFilters = this.summariseMeasurementsFilters();
    /* When filter categories were dynamically created (via metadata drag&drop) the `options` here updated but `<Async>`
    seemed to use a cached version of all values & wouldn't update. Changing the key forces a rerender, but it's not ideal */
    const divKey = String(Object.keys(this.props.totalStateCounts).join(","));
    return (
      <div style={styles.base} key={divKey}>
        <AsyncSelect
          name="filterQueryBox"
          placeholder="Type filter query here..."
          value={null}
          defaultOptions
          loadOptions={loadOptions}
          filterOption={filterOption}
          isClearable={false}
          isSearchable
          isMulti={false}
          components={{ DropdownIndicator: null, MenuList: VirtualizedMenuList }}
          onChange={this.selectionMade}
          styles={customSelectStyles}
        />
        {inUseFilters.length ? (
          <>
            <SidebarSubtitle spaceAbove>
              {`Currently selected filter categories:`}
            </SidebarSubtitle>
            {inUseFilters.map((filter) => (
              <div style={{display: 'inline-block', margin: '2px'}} key={filter.displayName}>
                <FilterBadge
                  active={filter.anyFiltersActive()}
                  canMakeInactive
                  id={filter.displayName}
                  remove={filter.remove}
                  activate={filter.activate}
                  inactivate={filter.inactivate}
                  onHoverMessage={`Data is currently filtered by ${filter.displayName}`}
                >
                  {filter.displayName}
                </FilterBadge>
              </div>
            ))}
          </>
        ) : null}
        {measurementsFilters.length ? (
          <>
            <SidebarSubtitle spaceAbove>
              {"Currently selected measurements filters:"}
            </SidebarSubtitle>
            {measurementsFilters.map(({field, activeFiltersCount, badgeTitle}) => (
              <div style={{display: 'inline-block', margin: '2px'}} key={badgeTitle}>
                <FilterBadge
                  active={activeFiltersCount > 0}
                  canMakeInactive
                  id={badgeTitle}
                  remove={() => this.props.dispatch(removeAllFieldFilters(field))}
                  activate={() => this.props.dispatch(toggleAllFieldFilters(field, true))}
                  inactivate={() => this.props.dispatch(toggleAllFieldFilters(field, false))}
                  onHoverMessage={`Measurements are currently filtered by ${badgeTitle}`}
                >
                  {badgeTitle}
                </FilterBadge>
              </div>
            ))}
          </>
        ): null}
      </div>
    );
  }
}

export const FilterInfo = (
  <>
    {`Use this box to filter the displayed data based upon filtering criteria.
    For instance, start typing a country's name to filter the data accordingly.`}
    <br/>
    Data is filtered by forming a union of selected values within each category, and then
    taking the intersection between categories (if more than one category is selected).
    <br/>
    Scroll to the bottom of the main page (under the data visualisation)
    to see an expanded display of filters and available values.
    <br/>
    Filter options prefixed with &quot;(M)&quot; are filters specific to the Measurements panel.
    They will have no effect on the phylogeny tree or other panels.
  </>
);

export default FilterData;

function filterBadgeDisplayName(n, filterName) {
  if (filterName===strainSymbol) return `${n} x samples`;
  if (filterName===genotypeSymbol) return `${n} x genotypes`;
  return `${n} x  ${filterName}`;
}
