import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { isEqual } from "lodash";
import Select from "react-select/lib/Select";
import { changeMeasurementsCollection } from "../../actions/measurements";
import { controlsWidth } from "../../util/globals";
import { SidebarSubtitle } from "./styles";

/**
 * React Redux selector function that takes the key and title for the
 * available collections to create the object expected for the Select library.
 * The label defaults to the key if a collection does not have a set title.
 * @param {Array<Object>} collections
 * @returns {Array<Object>}
 */
const collectionOptionsSelector = (collections) => {
  return collections.map((collection) => {
    return {
      value: collection.key,
      label: collection.title || collection.key
    };
  });
};

const MeasurementsOptions = () => {
  const dispatch = useDispatch();
  const collectionDisplayed = useSelector((state) => state.measurements.collectionToDisplay.key);
  const collectionOptions = useSelector((state) => collectionOptionsSelector(state.measurements.collections), isEqual);

  return (
    <div id="measurementsControls">
      <SidebarSubtitle>
        {"Collections"}
      </SidebarSubtitle>
      <div style={{ marginBottom: 10, width: controlsWidth, fontSize: 14}}>
        <Select
          name="measurementsCollections"
          id="measurementsCollections"
          value={collectionDisplayed}
          options={collectionOptions}
          clearable={false}
          searchable={false}
          multi={false}
          onChange={(opt) => {
            dispatch(changeMeasurementsCollection(opt.value));
          }}
        />
      </div>
    </div>
  );
};

export default MeasurementsOptions;
