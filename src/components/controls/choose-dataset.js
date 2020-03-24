import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ChooseDatasetSelect from "./choose-dataset-select";
import { SidebarHeader } from "./styles";

// const DroppedFiles = withTheme((props) => {
//   /* TODO: this shouldn't be in the auspice src, rather injected as an extension when needed */
//   return (
//     <div style={{ fontSize: 14, marginTop: 5, marginBottom: 5, color: props.theme.color}}>
//       <i className="fa fa-clone fa-lg" aria-hidden="true"/>
//       <span style={{position: "relative", paddingLeft: 10}}>{"dropped files"}</span>
//     </div>
//   );
// });

const checkEqualityOfArrays = (arr1, arr2, upToIdx) => {
  return arr1.slice(0, upToIdx).every((value, index) => value === arr2[index]);
};

@connect((state) => {
  return {
    available: state.controls.available
  };
})
class ChooseDataset extends React.Component {
  render() {
    const { t } = this.props;

    if (!this.props.available || !this.props.available.datasets || !this.props.available.datasets.length) {
      /* typically this is the case if the available dataset fetch hasn't returned
      or it has returned an empty array of datasets */
      return null;
    }

    const displayedDatasetString = window.location.pathname
      .replace(/^\//, '')
      .replace(/\/$/, '')
      .split(":")[0];
    const displayedDataset = displayedDatasetString.split("/");
    const options = [[]];

    this.props.available.datasets.forEach((d) => {
      const firstField = d.request.split("/")[0];
      if (!options[0].includes(firstField)) {
        options[0].push(firstField);
      }
    });


    for (let idx=1; idx<displayedDataset.length; idx++) {
      /* going through the fields which comprise the current dataset
      in order to create available alternatives for each field */
      options[idx] = [];
      this.props.available.datasets.forEach((singleAvailableOption) => {
        /* if the parents (and their parents etc) of this choice match,
        then we add that as a valid option */
        const fields = singleAvailableOption.request.split("/");
        if (checkEqualityOfArrays(fields, displayedDataset, idx) && options[idx].indexOf(fields[idx]) === -1) {
          options[idx].push(fields[idx]);
        }
      });
    }

    return (
      <>
        <SidebarHeader>{t("sidebar:Dataset")}</SidebarHeader>
        {options.map((option, optionIdx) => (
          <ChooseDatasetSelect
            key={option}
            dispatch={this.props.dispatch}
            choice_tree={displayedDataset.slice(0, optionIdx)}
            selected={displayedDataset[optionIdx]}
            options={option}
          />
        ))}
      </>
    );

  }
}

const WithTranslation = withTranslation()(ChooseDataset);
export default WithTranslation;
