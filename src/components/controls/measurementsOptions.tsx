import React from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks";
import { isEqual } from "lodash";
import {
  changeMeasurementsCollection,
  changeMeasurementsDisplay,
  changeMeasurementsGroupBy,
  toggleOverallMean,
  toggleThreshold
} from "../../actions/measurements";
import { controlsWidth } from "../../util/globals";
import { SidebarSubtitle, SidebarButton } from "./styles";
import Toggle from "./toggle";
import CustomSelect from "./customSelect";
import { Collection } from "../../reducers/measurements/types";
import { RootState } from "../../store";

interface SelectOption {
  value: string
  label: string
}

/**
 * React Redux selector function that takes the key and title for the
 * available collections to create the object expected for the Select library.
 * The label defaults to the key if a collection does not have a set title.
 */
const collectionOptionsSelector = (
  collections: Collection[]
): SelectOption[]  => {
  return collections.map((collection) => {
    return {
      value: collection.key,
      label: collection.title || collection.key
    };
  });
};

const MeasurementsOptions = () => {
  const dispatch = useAppDispatch();
  const collection = useSelector((state: RootState) => state.measurements.collectionToDisplay);
  const collectionOptions = useSelector((state: RootState) => collectionOptionsSelector(state.measurements.collections), isEqual);
  const groupBy = useSelector((state: RootState) => state.controls.measurementsGroupBy);
  const display = useSelector((state: RootState) => state.controls.measurementsDisplay);
  const showOverallMean = useSelector((state: RootState) => state.controls.measurementsShowOverallMean);
  const showThreshold = useSelector((state: RootState) => state.controls.measurementsShowThreshold);

  // Create grouping options for the Select library
  let groupingOptions: SelectOption[] = [];
  if (collection.groupings) {
    groupingOptions = [...collection.groupings.keys()].map((grouping) => {
      return {
        value: grouping,
        label: collection.fields.get(grouping).title
      };
    });
  }

  return (
    <div id="measurementsControls">
      <SidebarSubtitle>
        {"Collections"}
      </SidebarSubtitle>
      <div style={{ marginBottom: 10, width: controlsWidth, fontSize: 14}}>
        <CustomSelect
          name="measurementsCollections"
          id="measurementsCollections"
          value={collectionOptions.filter(({value}) => value === collection.key)}
          options={collectionOptions}
          isClearable={false}
          isSearchable={false}
          isMulti={false}
          onChange={(opt) => {
            dispatch(changeMeasurementsCollection(opt.value));
          }}
        />
      </div>
      <SidebarSubtitle>
        {"Group By"}
      </SidebarSubtitle>
      <div style={{ marginBottom: 10, width: controlsWidth, fontSize: 14}}>
        <CustomSelect
          name="measurementsGroupings"
          id="measurementsGroupings"
          value={groupingOptions.filter(({value}) => value === groupBy)}
          options={groupingOptions}
          isClearable={false}
          isSearchable={false}
          isMulti={false}
          onChange={(opt) => {dispatch(changeMeasurementsGroupBy(opt.value));}}
        />
      </div>
      <SidebarSubtitle>
        {"Measurements Display"}
      </SidebarSubtitle>
      <SidebarButton
        selected={display === "mean"}
        onClick={() => {dispatch(changeMeasurementsDisplay("mean"));}}
      >
        {"Mean ± SD"}
      </SidebarButton>
      <SidebarButton
        selected={display === "raw"}
        onClick={() => {dispatch(changeMeasurementsDisplay("raw"));}}
      >
        {"Raw"}
      </SidebarButton>
      <Toggle
        style={{ padding: "10px 0px"}}
        display
        on={showOverallMean}
        label="Show overall mean ± SD"
        callback={() => dispatch(toggleOverallMean())}
      />
      <Toggle
        // Only display threshold toggle if the collection has a valid threshold
        display={
          Array.isArray(collection.thresholds) &&
          collection.thresholds.some((threshold) => typeof threshold === "number")
        }
        on={showThreshold}
        label="Show measurement threshold(s)"
        callback={() => dispatch(toggleThreshold())}
      />
    </div>
  );
};

export default MeasurementsOptions;
