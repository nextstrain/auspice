import React from "react";
import { connect } from "react-redux";
import { withTranslation, WithTranslation as WithTranslationProps } from "react-i18next";
import { toggleTemporalConfidence, changeDistanceMeasure } from "../../actions/tree";
import { SidebarSubtitle } from "./styles";
import { controlsWidth } from "../../util/globals";
import Toggle from "./toggle";
import CustomSelect from "./customSelect";
import { RootState, AppDispatch } from "../../store";
import { MUTATION_COUNT_PREFIX, DistanceMeasure } from "../../util/computeDistanceMetric";
import type { GenomeMap } from "../../util/entropyCreateStateFromJsons";

const mapStateToProps = (state: RootState): {
  distanceMeasure: RootState["controls"]["distanceMeasure"];
  layout: RootState["controls"]["layout"];
  showTreeToo: RootState["controls"]["showTreeToo"];
  availableDistanceMeasures: RootState["controls"]["availableDistanceMeasures"];
  streamTreesToggledOn: RootState["controls"]["showStreamTrees"];
  temporalConfidence: RootState["controls"]["temporalConfidence"];
  genomeMap: GenomeMap;
} => ({
  distanceMeasure: state.controls.distanceMeasure,
  layout: state.controls.layout,
  showTreeToo: state.controls.showTreeToo,
  availableDistanceMeasures: state.controls.availableDistanceMeasures,
  streamTreesToggledOn: state.controls.showStreamTrees,
  temporalConfidence: state.controls.temporalConfidence,
  genomeMap: state.entropy?.genomeMap,
});

type ChooseMetricProps = ReturnType<typeof mapStateToProps> & WithTranslationProps & {
  dispatch: AppDispatch;
};

interface SelectOption {
  value: DistanceMeasure;
  label: string;
}

/* implements a pair of buttons that toggle between time & divergence tree layouts */
class ChooseMetric extends React.Component<ChooseMetricProps> {

  options(): SelectOption[] {
    const niceNames = {
      div: this.props.t("sidebar:divergence"),
      num_date: this.props.t("sidebar:time")
    }
    return this.props.availableDistanceMeasures.map((m) => {
      return { value: m, label: niceNames[m] || m.replace(MUTATION_COUNT_PREFIX, 'Mutation counts: ') }
    });
  }

  override render(): JSX.Element | null {
    const { t } = this.props;
    if (this.props.layout==="scatter" || this.props.layout==="clock") return null;

    const options = this.options();
    const selected = options.find(({ value }) => value === this.props.distanceMeasure) || null;

    const temporalConfidenceDisabled = this.props.streamTreesToggledOn;
    const temporalConfidenceLabel = temporalConfidenceDisabled ? t("sidebar:Confidence intervals disabled") : t("sidebar:Show confidence intervals")

    return (
      <div style={{marginBottom: 0}}>
        <SidebarSubtitle>
          {t("sidebar:Branch Length")}
        </SidebarSubtitle>

        <div style={{width: controlsWidth, fontSize: 14, marginBottom: 8}}>
          <CustomSelect
            value={selected}
            options={options}
            isClearable={false}
            isSearchable={false}
            isMulti={false}
            placeholder={t("sidebar:Mutations (nuc / CDS)")}
            onChange={(option: SelectOption | null): void => {
              if (option) this.props.dispatch(changeDistanceMeasure(option.value));
            }}
          />
        </div>

        {this.props.showTreeToo ?
          null : (
            <div style={{marginBottom: 8}}>
              <Toggle
                display={this.props.temporalConfidence.display}
                on={this.props.temporalConfidence.on}
                disabled={temporalConfidenceDisabled}
                callback={(): void => {this.props.dispatch(toggleTemporalConfidence())}}
                label={temporalConfidenceLabel}
              />
            </div>
          )
        }

      </div>
    );
  }
}

const WithTranslation = withTranslation()(connect(mapStateToProps)(ChooseMetric));
export default WithTranslation;
