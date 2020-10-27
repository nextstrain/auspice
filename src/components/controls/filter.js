import React from "react";
import { connect } from "react-redux";
import Select from "react-select/lib/Select";
import { controlsWidth, isValueValid } from "../../util/globals";
import { applyFilter } from "../../actions/tree";

/**
 * <FilterData> is a (keyboard)-typing based search box intended to
 * allow users to filter samples. The filtering rules are not implemented
 * in this component, but are useful to spell out: we take the union of
 * entries within each category and then take the intersection of those unions.
 */
@connect((state) => {
  return {
    activeFilters: state.controls.filters,
    totalStateCounts: state.tree.totalStateCounts
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
  makeOptions = () => {
    /**
     * The <Select> component needs an array of options to display (and search across). We compute this
     * by looping across each filter and calculating all valid options for each. This function runs
     * each time a filter is toggled on / off.
     */
    const options = [];
    Object.keys(this.props.activeFilters)
      .forEach((filterName) => {
        const filterValuesCurrentlyActive = this.props.activeFilters[filterName].filter((x) => x.active).map((x) => x.value);
        Array.from(this.props.totalStateCounts[filterName].keys())
          .filter((itemName) => isValueValid(itemName)) // remove invalid values present across the tree
          .filter((itemName) => !filterValuesCurrentlyActive.includes(itemName)) // remove already enabled filters
          .sort() // filters are sorted alphabetically - probably not necessary for a select component
          .forEach((itemName) => {
            options.push({
              label: `${filterName} → ${itemName}`,
              value: [filterName, itemName]
            });
          });
      });
    return options;
  }
  selectionMade = (sel) => {
    this.props.dispatch(applyFilter("add", sel.value[0], [sel.value[1]]));
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.base}>
        <Select
          name="filterQueryBox"
          placeholder="Type filter query here..."
          value={undefined}
          arrowRenderer={null}
          options={this.makeOptions()}
          clearable={false}
          searchable
          multi={false}
          onChange={this.selectionMade}
        />
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
  </>
);

export default FilterData;
