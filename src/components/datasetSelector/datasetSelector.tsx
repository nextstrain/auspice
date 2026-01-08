import React from "react";
import { withTranslation } from 'react-i18next';
import { connect, MapStateToProps } from "react-redux";
import { FaPlay, FaTimesCircle } from "react-icons/fa";
import type { RootState, AppDispatch } from '../../store'
import { changePage } from "../../actions/navigation";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";
import CustomSelect from "../controls/customSelect";
import { Dataset, currentDataset, SIDEBAR_DATASET_CHANGE_ID } from "../controls/choose-dataset";

/**
 * A note on snapshots: Nextstrain.org now has support for snapshots (for
 * certain datasets), which are encoded as a trailing '@YYYY-MM-DD' part of the
 * dataset name/URL. As long as the snapshot syntax is valid (and the underlying
 * resource supports snapshots) then the nextstrain.org server will return the
 * dataset which was the current one at that date. (Invalid syntax results in a
 * BadRequest response.)
 *
 * Vanilla Auspice, and parts of nextstrain.org (community, groups etc) don't
 * support snapshots. In the vanilla Auspice server, supplying a snapshot only
 * works if the '@YYYY-MM-DD' string is part of the actual filename (if it's
 * not, we get a 302 redirect or 404). In nextstrain.org we'll get BadRequest
 * responses.
 *
 * The current implementation allows snapshots for any dataset, i.e. it caters
 * spefically for nextstrain.org usage!
 */

interface State {
  currentDataset: Dataset;
  proposedDataset: Dataset;
  snapshotInput: string; // raw input value (may be invalid)
  loadButtonHovered: boolean;
}

/**
 * A tree-like structure encoding available resources as a hierarchy of their constituent "parts"
 * E.g. resources seasonal-flu/h3n2/ha/6m and seasonal-flu/h3n2/ha/2y would have the structure
 * .seasonal-flu.h3n2.ha.6m = true
 *                      .2y = true
 */
interface RequestHierarchy {
  [key: string]: RequestHierarchy | true
}


interface StateProps {
  available: {dataset?: RequestHierarchy, narrative?: RequestHierarchy};
}


/**
 * The main UI element to change dataset, rendered as a modal
 */
class DatasetSelector extends React.Component<StateProps & {dispatch: AppDispatch}, State> {

  constructor(props) {
    super(props);
    const d = currentDataset();
    this.state = {
      currentDataset: d,
      proposedDataset: {...d}, // shallow is ok
      snapshotInput: d.snapshot || '',
      loadButtonHovered: false,
    }
  }

  handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      this.changeDataset();
    }
  }

  changeDataset = (): void => {
    // reset redux controls state in preparation for a change
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const nextstrain = (window as any).NEXTSTRAIN; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (nextstrain && nextstrain.animationTickReference) {
      clearInterval(nextstrain.animationTickReference);
      nextstrain.animationTickReference = null;
      this.props.dispatch({type: MAP_ANIMATION_PLAY_PAUSE_BUTTON, data: "Play"});
    }
    this.props.dispatch(changePage({path: _path(this.state.proposedDataset)}));
  }


  updateProposedParts = (idx, value): void => {
    const selected = {
      parts: [...this.state.proposedDataset.parts.slice(0, idx), value],
      snapshot: this.state.proposedDataset.snapshot,
    };
    /* fill in further options! */
    let options = this.options(selected.parts);
    while (options.length > 0) {
      const values = options.map((opt) => opt.value)
      // At the proposed position, does the current dataset have a value?
      const previousValue = this.state.currentDataset.parts[selected.parts.length];
      if (values.includes(previousValue)) {
        selected.parts.push(previousValue)
      } else {
        // What to choose for the "default" next value, if the previous one at this level isn't
        // valid? We simply take the first available option, but in the nextstrain.org context
        // the server's manifest has a better default. We could explore better choices in the future.
        selected.parts.push(values[0]);
      }
      options = this.options(selected.parts);
    }
    this.setState({proposedDataset: selected});
  }


  updateProposedSnapshot = (snapshot: string|undefined = undefined): void => {
    this.setState({
      proposedDataset: {
        parts: this.state.proposedDataset.parts,
        snapshot: snapshot || undefined,
      }
    });
  }


  /**
   * Get the available options of the available data given a list of keys. In
   * other words, we traverse the props.available hierarchy given some keys and then report
   * the available keys at that level
   */
  options = (keys: string[]): {value: string, label: string}[] => {
    let _pointer: RequestHierarchy = {...this.props.available.dataset};
    for (const key of keys) {
      const next = _pointer[key];
      if (typeof next === 'object') {
        _pointer = {...next};
      } else { // reached a leaf node (true) - no further options
        return [];
      }
    }
    const values = Array.from(Object.keys(_pointer));
    // format the values for react-select
    return values.map((value) => ({
      value,
      label: values.length===1 ? `${value} (only available option)` : value,
    }));
  }


  /**
   * Render a dropdown selector for a given "level" in the dataset hierarchy
   */
  renderLevel = (currentValue: string, currentIdx: number): JSX.Element => {
    const options = this.options(this.state.proposedDataset.parts.slice(0, currentIdx));
    const style = {paddingLeft: '0px', paddingTop: '10px'};

    if (options.length===0) {
      return (<div style={style}>Unexpected error!</div>)
    }

    return (
      <div key={currentIdx} style={style}>
        <CustomSelect
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            option: (base) => ({ ...base, fontSize: '14px' }),
            control: (base) => ({
              ...base,
              backgroundColor: options.length === 1 ? '#e0e0e0' : base.backgroundColor,
              width: '500px',
              maxWidth: '90%',
            }),
          }}
          options={options}
          isClearable={false}
          isSearchable={true}
          isMulti={false}
          isDisabled={options.length === 1}
          value={options.filter((opt) => opt.value === currentValue)}
          onChange={(opt): void => this.updateProposedParts(currentIdx, opt.value)}
        />
      </div>
    )
  }


  /**
   * Render a provided dataset as formatted text.
   * If *matchAgainst* is provided, then parts of the provided dataset which don't match
   * are emphasized.
   */ 
  renderDatasetName = (dataset: Dataset, matchAgainst?: Dataset): JSX.Element[] => {
    const jsx: JSX.Element[] = dataset.parts.flatMap((word, idx) => {
      // highlight (red) if changed
      const style = matchAgainst && matchAgainst.parts[idx]!==word ? {color: 'orange'} : {}
      return [<Strong style={style} key={word}>{word}</Strong>, idx+1===dataset.parts.length ? null : <span key={word+"slash"}> / </span>]
    })
    if (dataset.snapshot) {
      jsx.push(<span key='snapshot-symbol'> @ </span>)
      const style = matchAgainst && matchAgainst.snapshot!==dataset.snapshot ? {color: 'orange'} : {}
      jsx.push(<Strong style={style} key='snapshot-value'>{dataset.snapshot}</Strong>)
    }
    return jsx;
  }


  /**
   * Render a freeform text input for snapshot name, styled to match
   * CustomSelect. Snapshots must match YYYY-MM-DD to be valid and thus be part
   * of the proposed dataset.
   *
   * See the comment at the top of this file for discussino about snapshots &
   * Auspice
   */
  renderSnapshot = (): JSX.Element => {
    const style = {paddingLeft: '0px', paddingTop: '10px'};
    const containerStyle = {
      position: 'relative' as const,
      maxWidth: '300px',
      width: '90%',
    };
    const inputStyle = {
      width: '100%',
      padding: '8px',
      paddingRight: '32px',
      fontSize: '14px',
      border: '1px solid hsl(0, 0%, 80%)',
      borderRadius: '4px',
      backgroundColor: 'white',
      outline: 'none',
      boxSizing: 'border-box' as const,
    };
    const clearButtonStyle = {
      position: 'absolute' as const,
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: 'hsl(0, 0%, 60%)',
      display: 'flex',
      alignItems: 'center',
    };

    const { snapshotInput } = this.state;
    const isInvalid = snapshotInput !== '' && !_validSnapshot(snapshotInput);

    return (
      <div style={style}>
        <div style={containerStyle}>
          <input
            type="text"
            placeholder="(optional) YYYY-MM-DD snapshot"
            style={{
              ...inputStyle,
              color: isInvalid ? 'red' : undefined,
            }}
            value={snapshotInput}
            onChange={(e): void => {
              const value = e.target.value;
              this.setState({ snapshotInput: value });
              // Only update proposedDataset if valid or empty
              if (value === '' || _validSnapshot(value)) {
                this.updateProposedSnapshot(value || undefined);
              }
            }}
            onFocus={(e): void => {
              e.target.style.borderColor = 'hsl(0, 0%, 70%)';
            }}
            onBlur={(e): void => {
              e.target.style.borderColor = 'hsl(0, 0%, 80%)';
            }}
          />
          {snapshotInput && (
            <span
              style={clearButtonStyle}
              onClick={(): void => {
                this.setState({ snapshotInput: '' });
                this.updateProposedSnapshot("");
              }}
            >
              <FaTimesCircle size={16} />
            </span>
          )}
        </div>
      </div>
    );
  }

  renderDatasetLoader(): JSX.Element {
    return (
      <button
        style={{
          marginTop: '10px',
          background: this.state.loadButtonHovered ? '#f1f1f1' : '#fafafa',
          border: '1px solid #888',
          borderRadius: '5px',
          padding: 5,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          maxWidth: '90%',
        }}
        onClick={this.changeDataset}
        onMouseEnter={(): void => this.setState({loadButtonHovered: true})}
        onMouseLeave={(): void => this.setState({loadButtonHovered: false})}
      >
        <FaPlay color="#888" />
        LOAD PROPOSED DATASET (or press enter)
      </button>
    );
  }

  override render(): JSX.Element {
    return (
      <div onKeyDownCapture={this.handleKeyDown}>
        Select a new dataset by changing the hierarchical selectors below
        <p/>

        <span style={{display: 'inline-block', width: 120}}>Current dataset:</span>
        {this.renderDatasetName(this.state.currentDataset)}
        <br/>
        <span style={{display: 'inline-block', width: 120}}>Proposed dataset:</span>
        {this.renderDatasetName(this.state.proposedDataset, this.state.currentDataset)}

        {this.state.proposedDataset.parts.map(this.renderLevel)}
        {this.renderSnapshot()}
        {this.renderDatasetLoader()}

        <br/>
        <h3>How does this work?</h3>
        {`Changing intermediate levels of the selected dataset results in a new set of possible options for lower levels in the hierarchy;
        if possible we'll use the previous value for new levels but this may not be possible. `}
        {`You can compare the current dataset against the proposed one above the selectors, with differences shown in orange. `}
        {`Changing intermediate levels of the selected dataset results in a new set of possible options for lower levels in the hierarchy.`}
        <br/>
        {`The full complement of datasets all available datasets are available here, you may need to `}
        <a href='/'>go back to the main page</a>
        {` to access other resources.`}
      </div>
    )
  }
}


const mapStateToProps: MapStateToProps<StateProps, Record<string, never>, RootState> = (
  state: RootState,
): StateProps => ({
  available: _parseAvailable(state.controls.available),
});


export default withTranslation()(connect(mapStateToProps)(DatasetSelector));


function Strong({style={}, children}): JSX.Element {
  return <span style={{...style, fontWeight: 700}}>{children}</span>
}


/**
 * Style overrides for the modal component (and background etc). The intention is
 * to appear adjacent to the sidebar dataset display (which you click to open the modal)
 * insipired by some of the UI in https://github.com/ (e.g. the main search bar)
 */
export const datasetSelectorStyles = {
  container: (s: React.CSSProperties): React.CSSProperties => {
    s.backgroundColor = "rgba(0, 0, 0, .30)";
    s.display = undefined;
    return s
  },
  panel: (s: React.CSSProperties, browserDimensions: {width: number, height: number}): React.CSSProperties => {
    const source = document.querySelector(`#${SIDEBAR_DATASET_CHANGE_ID}`)
      ?.getBoundingClientRect();
    const smallScreen = browserDimensions.width < (500 + (source?.left||0) * 2)
    s.left = smallScreen ? 5 : source?.left;
    s.top = source?.top;
    s.padding = '2%';
    s.color = "#1f2328";
    s.backgroundColor = "#ffffff";
    if (smallScreen) {
      s.width = browserDimensions.width - 10; // 2 x 5px spacing buffer side
      s.maxWidth = s.width;
    } else {
      s.minWidth = 500;
      s.width = browserDimensions.width * 0.5;
    }
    return s
  }
};


/**
 * convert a *Dataset* object to a dataset (url) path
 */
function _path(dataset: Dataset): string {
  return dataset.parts.join('/') + (dataset.snapshot ? `@${dataset.snapshot}` : '');
}


/**
 * Construct the structure of possible datasets and narratives.
 * Note that narratives are parsed since they're in the redux store, but this component
 * doesn't yet allow them to be selected.
 */
function _parseAvailable(available: RootState["controls"]["available"]): StateProps["available"] {
  const result: StateProps["available"] = {};

  // Helper to build nested hierarchy from path segments
  const buildHierarchy = (items: { request: string }[]): RequestHierarchy => {
    const hierarchy: RequestHierarchy = {};
    for (const item of items) {
      const segments = item.request.split("/");
      let current: RequestHierarchy = hierarchy;
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const isLast = i === segments.length - 1;
        if (isLast) {
          current[segment] = true;
        } else {
          if (current[segment] === true || !current[segment]) {
            current[segment] = {};
          }
          const next = current[segment];
          if (typeof next === "object") {
            current = next;
          }
        }
      }
    }

    return hierarchy;
  };
  if (available?.datasets?.length) {
    result.dataset = buildHierarchy(available.datasets);
  }
  if (available?.narratives?.length) {
    result.narrative = buildHierarchy(available.narratives);
  }
  return result;
}


function _validSnapshot(snapshot:string): boolean {
  const snapshotRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!snapshotRegex.test(snapshot)) return false
  const parts = snapshot.split('-').map((p) => parseInt(p, 10))
  // Note that the nextstrain server handles "invalid" months/days, but do some low-effort validation here
  if (parts[1]===0 || parts[1]>12 || parts[2]===0 || parts[2]>31) return false
  return true
}