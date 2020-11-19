import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ChooseDatasetSelect from "./choose-dataset-select";
import { AnnotatedHeader } from "./annotatedHeader";

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

    const options = displayedDataset.map((_, i) =>
      Array.from(
        new Set(
          this.props.available.datasets
            .filter((ds) => checkEqualityOfArrays(ds.request.split("/"), displayedDataset, i))
            .map((ds) => ds.request.split("/")[i])
        )
      ).map((opt) => ({
        value: displayedDataset.slice(0, i).concat(opt).join("/"),
        label: opt
      }))
    );

    return (
      <>
        <AnnotatedHeader title={t("sidebar:Dataset")} />
        {options.map((option, optionIdx) => (
          <ChooseDatasetSelect
            key={displayedDataset[optionIdx]}
            dispatch={this.props.dispatch}
            selected={displayedDataset.slice(0, optionIdx + 1).join("/")}
            options={option}
          />
        ))}
      </>
    );

  }
}

const WithTranslation = withTranslation()(ChooseDataset);
export default WithTranslation;
