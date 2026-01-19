import React from "react";
import { connect, MapStateToProps } from "react-redux";
import { withTranslation, WithTranslation } from "react-i18next";
import styled from "styled-components";
import { SidebarSubtitle } from "./styles";
import { SET_MODAL } from "../../actions/types";
import { FaSearch } from "react-icons/fa";
import type { RootState, AppDispatch } from "../../store";

const DatasetSelectContainer = styled.div`
  cursor: pointer;
  padding-top: 20px;

  &:hover ${SidebarSubtitle} {
    color: ${(props): string => props.theme.selectedColor};
  }
`;

const DatasetName = styled(SidebarSubtitle)`
  font-size: 16px;
`;

const ChangeDatasetRow = styled.div`
  padding-top: 5px;
`;

const ChangeDatasetLabel = styled(SidebarSubtitle)`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SearchIcon = styled(FaSearch)`
  position: relative;
  top: 1px;
`;

export interface Dataset {
  parts: string[]
  snapshot?: string
}

export function currentDataset(): Dataset {
  const parts = window.location.pathname
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .split(":")[0] // drop any tangletree dataset (RHS tree / second tree)
    .split('/');
  let snapshot: string | undefined;
  const lastPart = parts.at(-1);
  if (lastPart && lastPart.includes('@')) {
    const [word, snap] = lastPart.split('@');
    parts[parts.length - 1] = word;
    snapshot = snap;
  }
  return { parts, snapshot };
}

export const SIDEBAR_DATASET_CHANGE_ID = 'sidebar-dataset-change';

interface StateProps {
  available: RootState["controls"]["available"];
}

interface DispatchProps {
  dispatch: AppDispatch;
}

type Props = StateProps & DispatchProps & WithTranslation;

class ChooseDataset extends React.Component<Props> {
  override render(): JSX.Element | null {
    if (!this.props.available?.datasets?.length) {
      /* typically this is the case if the available dataset fetch hasn't returned
      or it has returned an empty array of datasets */
      return null;
    }

    const dataset = currentDataset();

    return (
      <DatasetSelectContainer
        id='dataset-select'
        role="button"
        tabIndex={0}
        aria-label="Change dataset"
        onClick={(): void => {
          this.props.dispatch({ type: SET_MODAL, modal: "datasetSelector" })
        }}
      >
        <DatasetName>
          {dataset.parts.join(' / ') + (dataset.snapshot ? ` @ ${dataset.snapshot}` : '')}
        </DatasetName>

        <ChangeDatasetRow id={SIDEBAR_DATASET_CHANGE_ID}>
          <ChangeDatasetLabel>
            <SearchIcon />
            {this.props.t('sidebar:change dataset')}
          </ChangeDatasetLabel>
        </ChangeDatasetRow>
      </DatasetSelectContainer>
    );
  }
}

const mapStateToProps: MapStateToProps<StateProps, Record<string, never>, RootState> = (
  state: RootState,
): StateProps => ({
  available: state.controls.available
});

const ChooseDatasetConnected = withTranslation()(connect(mapStateToProps)(ChooseDataset));
export default ChooseDatasetConnected;
