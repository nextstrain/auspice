import React from "react";
import { useTranslation } from 'react-i18next';
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks";
import { toggleStreamTree, changeStreamTreeBranchLabel, toggleStreamTreeLabels, changeStreamTreeTargetCount, toggleStreamTreeUpdateLayout } from "../../actions/treeStreams";
import { AUTO_STREAM_LABEL, AUTO_STREAM_TARGET_COUNTS } from "../../util/treeStreams";
import Toggle from "./toggle";
import { RootState } from "../../store";
import { FaInfoCircle } from "react-icons/fa";
import { SidebarSubtitleFlex, StyledTooltip, SidebarIconContainer, SidebarSubtitle, SidebarButton } from "./styles";
import { controlsWidth } from "../../util/globals";
import CustomSelect from "./customSelect";

export const ChooseStreamTrees = (): JSX.Element => {
  const streamTreesToggledOn = useSelector((state: RootState) => state.controls.showStreamTrees);
  const streamTreeBranchLabel = useSelector((state: RootState) => state.controls.streamTreeBranchLabel);
  const streamTreeTargetCount = useSelector((state: RootState) => state.controls.streamTreeTargetCount);
  const showStreamTreeLabels = useSelector((state: RootState) => state.controls.showStreamTreeLabels);
  const streamTreeUpdateLayout = useSelector((state: RootState) => state.controls.streamTreeUpdateLayout);
  const showTreeToo = useSelector((state: RootState) => state.controls.showTreeToo);
  const focusOn = useSelector((state: RootState) => state.controls.focus);
  const rectangular = useSelector((state: RootState) => state.controls.layout === "rect");
  const explodedTree = useSelector((state: RootState) => !!state.controls.explodeAttr);
  const availableBranchLabels = useSelector((state: RootState) => state.controls.availableStreamLabelKeys);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  /** Certain conditions mean we can't show stream trees. If the dataset doesn't support them
   * (either because there are no branch labels on the tree or the dataset specifies an empty
   * array of `stream_labels`) we don't show any streamtrees-related UI. If the dataset supports
   * them but they're not available we show a disabled toggle and an info-box explanation
   */
  if (!availableBranchLabels.length) return null;

  const unavailable = []; // empty array means it is available
  if (showTreeToo) unavailable.push("Two trees are being displayed");
  if (focusOn) unavailable.push("'Focus on selected' is on");
  if (!rectangular) unavailable.push("Tree layout is not rectangular");
  if (explodedTree) unavailable.push("Viewing exploded tree");

  const selectOptions = [
    ...availableBranchLabels.map((x) => ({value: x, label: x === AUTO_STREAM_LABEL ? "Automatic (by clade size)" : x}))
  ];

  return (
    <div>
      <div style={{marginBottom: 8 }}>
        <Toggle
          display
          isExperimental
          on={streamTreesToggledOn}
          disabled={unavailable.length>0}
          callback={(): void => dispatch(toggleStreamTree())}
          label={<Label t={t} toggleOn={streamTreesToggledOn} unavailable={unavailable}/>}
        />
      </div>

      { streamTreesToggledOn && (
        <div style={{paddingTop: 0, paddingBottom: 20}}>
          <SidebarSubtitleFlex data-tip data-for="select-stream-branch-label">
            <span style={{ position: "relative" }}>
              {t("sidebar:Stream-tree branch label")}
            </span>
          </SidebarSubtitleFlex>
          <div style={{width: controlsWidth, fontSize: 14}}>
            <CustomSelect
              value={selectOptions.filter(({value}) => value === streamTreeBranchLabel)}
              options={selectOptions}
              isClearable={false}
              isSearchable={false}
              isMulti={false}
              onChange={(value): void => dispatch(changeStreamTreeBranchLabel(value.value))}
            />
          </div>
          { streamTreeBranchLabel === AUTO_STREAM_LABEL && (
            <div style={{marginTop: 8}}>
              <SidebarSubtitle>
                {t("sidebar:Streamtree granularity")}
              </SidebarSubtitle>
              <SidebarButton
                selected={streamTreeTargetCount === AUTO_STREAM_TARGET_COUNTS.fine}
                onClick={(): void => dispatch(changeStreamTreeTargetCount(AUTO_STREAM_TARGET_COUNTS.fine))}
              >
                {t("sidebar:Fine")}
              </SidebarButton>
              <SidebarButton
                selected={streamTreeTargetCount === AUTO_STREAM_TARGET_COUNTS.medium}
                onClick={(): void => dispatch(changeStreamTreeTargetCount(AUTO_STREAM_TARGET_COUNTS.medium))}
              >
                {t("sidebar:Medium")}
              </SidebarButton>
              <SidebarButton
                selected={streamTreeTargetCount === AUTO_STREAM_TARGET_COUNTS.coarse}
                onClick={(): void => dispatch(changeStreamTreeTargetCount(AUTO_STREAM_TARGET_COUNTS.coarse))}
              >
                {t("sidebar:Coarse")}
              </SidebarButton>
            </div>
          )}
          <div style={{marginTop: 8}}>
            <Toggle
              display
              on={showStreamTreeLabels}
              callback={(): void => dispatch(toggleStreamTreeLabels())}
              label="Show stream labels"
            />
          </div>
          <div style={{marginTop: 8}}>
            <Toggle
              display
              on={streamTreeUpdateLayout}
              callback={(): void => dispatch(toggleStreamTreeUpdateLayout())}
              label={t("sidebar:Update layout")}
            />
          </div>
        </div>
      )}

    </div>
  )
}

function Label(
  {t, toggleOn, unavailable}: {t, toggleOn: boolean, unavailable: string[]}
): JSX.Element {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ marginRight: "5px" }}>
        {unavailable.length ? 
          t("sidebar:Streamtrees unavailable") :
          t("sidebar:Show streamtrees")}
      </span>
      <SidebarIconContainer style={{ display: "inline-flex" }} data-tip data-for="toggle-stream-trees">
        <FaInfoCircle />
      </SidebarIconContainer>
      <StyledTooltip place="bottom" type="dark" effect="solid" id="toggle-stream-trees">
        <>
          This functionality is experimental and should be treated with caution!
          <p/>
          Stream trees allow parts of the tree to be summarised by a stream-graph,
          similar to the frequencies panel. This can be helpful to understand the broader
          dynamics within this part of the tree as well as allowing Auspice to display
          larger trees with improved performance.
          <p/>
          {unavailable.length ? (
            <>
              Stream trees are currently unavailable because:
              <ul>
                {unavailable.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
            ) :
            `Branch labels within a tree are used to partition the tree into discrete streams.
              ${toggleOn ?
              `The dropdown immediately below allows you to change this label.` :
              `Toggle on stream trees to show a dropdown of available branch labels.`}`
          }

        </>
      </StyledTooltip>
    </div>
  )
}
