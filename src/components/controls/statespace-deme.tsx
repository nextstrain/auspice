import React from "react";
import { connect } from "react-redux";
import { withTranslation, WithTranslation } from "react-i18next";
import { controlsWidth } from "../../util/globals";
import { CHANGE_STATESPACE_DEME } from "../../actions/types";
import { SidebarSubtitle } from "./styles";
import CustomSelect from "./customSelect";
import { BasicControlsState } from "../../reducers/controls";
import { isColorByGenotype } from "../../util/getGenotype";
import { AppDispatch } from "../../store";

interface Props {
  statespaceDeme: BasicControlsState['statespaceDeme']
  metadataLoaded: boolean // redux metadata not yet typed
  geoResolutions: Record<string,string>[] // redux metadata not yet typed
  colorings: {[key: string]: Record<string,string>} // redux metadata not yet typed
  dispatch: AppDispatch
  t: WithTranslation['t']
}

interface SelectOption {
  value: string
  label: string
}

class StatespaceDeme extends React.Component<Props> {

  options(): SelectOption[] {
    if (!this.props.metadataLoaded) return [];
    const opts = Object.fromEntries(
      this.props.geoResolutions.map((g) => [g.key, {value: g.key, label: g.title || g.key}])
    );

    candidateStatespaceColorings(this.props.colorings)
      .filter(([key, ]) => opts[key]===undefined) // drop colorings which were geo resolutions
      .forEach(([key, info]) => {opts[key] = {value: key, label: info.title}});

    return Array.from(Object.values(opts));
  }

  override render(): JSX.Element {
    const { t } = this.props;
    const options = this.options();
    return (
      <>
        <SidebarSubtitle spaceAbove>
          {t("sidebar:Statespace demes")}
        </SidebarSubtitle>
        <div style={{marginBottom: 10, width: controlsWidth, fontSize: 14}}>
          <CustomSelect
            name="selectStatespaceDemes"
            id="selectStatespaceDemes"
            value={options.filter(({value}) => value === this.props.statespaceDeme)}
            options={options}
            isClearable={false}
            isSearchable={false}
            isMulti={false}
            onChange={(opt: SelectOption):void => {
              this.props.dispatch({ type: CHANGE_STATESPACE_DEME, statespaceDeme: opt.value })
            }}
          />
        </div>
      </>
    );
  }
}

const mapStateToProps = (state: any): Omit<Props, 'dispatch' | 't'> => {
  return {
    statespaceDeme: state.controls.statespaceDeme,
    metadataLoaded: state.metadata.loaded,
    geoResolutions: state.metadata.geoResolutions,
    colorings: state.metadata.colorings,
  };
};

const ConnectedStateSpace = withTranslation()(connect(mapStateToProps)(StatespaceDeme));
export default ConnectedStateSpace;

type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

export function candidateStatespaceColorings<C extends Props['colorings']>(
  colorings: C
): Array<Entry<C>> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (Object.entries(colorings) as Array<Entry<C>>)
    .filter(([key, info]) => info.type==='categorical' && key!=='gt')
}

/**
 * Default statespace deme key is the chosen geographic resolution if it exists,
 * else the chosen color-by
 * @param geoResolution D
 * @param colorBy 
 * @param colorings 
 * @returns 
 */
export function defaultStatespaceDeme(
  geoResolution: BasicControlsState['geoResolution'],
  colorBy: BasicControlsState['colorBy'],
):string|undefined {
  if (geoResolution) {
    return geoResolution;
  }
  if (colorBy && !isColorByGenotype(colorBy)) {
    return colorBy;
  }
  return undefined;
}