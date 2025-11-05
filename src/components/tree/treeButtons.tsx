import React, {ReactElement} from "react";
import { FaSearchMinus } from "react-icons/fa";
import { Root, updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";
import { getParentBeyondPolytomy, getParentStream } from "./phyloTree/helpers";
import { tabSingle, darkGrey, lightGrey } from "../../globalStyles";
import { TreeComponentProps } from "./types";

type Props = TreeComponentProps & {
  /* RHS offset in pixels */
  offsetPx: number;

  /* Are the buttons for the main tree or the second (RHS) tree? */
  mainTree: boolean;
}

export function TreeButtons(props: Props): ReactElement {
  if (props.narrativeMode) {
    return null; // hide the buttons when viewing a narrative to prevent tree manipulations
  }
  const tree = props.mainTree ? props.tree : props.treeToo;
  const filtered = !!tree.idxOfFilteredRoot &&
    tree.idxOfInViewRootNode !== tree.idxOfFilteredRoot;
  const activeZoomButton = filtered;
  const treeZoomed = tree.idxOfInViewRootNode !== 0;

  const containerStyles: React.CSSProperties = {zIndex: 100, position: "absolute", right: props.offsetPx, top: 0};
  const baseButtonStyles: React.CSSProperties = {...tabSingle, zIndex: 100, display: "inline-block", marginLeft: "4px"};
  const selectedButtonStyles: React.CSSProperties = {...baseButtonStyles, cursor: "pointer", color: darkGrey, pointerEvents: "auto"};
  const unselectedButtonStyles: React.CSSProperties = {...baseButtonStyles, cursor: "auto", color: lightGrey, pointerEvents: "none"};

  return (
    <div style={containerStyles}>
      
      <button style={treeZoomed ? selectedButtonStyles : unselectedButtonStyles} onClick={zoomBack}>
        <FaSearchMinus/>
      </button>

      <button style={activeZoomButton ? selectedButtonStyles : unselectedButtonStyles} onClick={zoomToSelected}>
        {props.t("Zoom to Selected")}
      </button>

      <button style={treeZoomed ? selectedButtonStyles : unselectedButtonStyles} onClick={redrawTree}>
        {props.t("Zoom to Root")}
      </button>

    </div>
  );

  function zoomToSelected(): void {
    props.dispatch(updateVisibleTipsAndBranchThicknesses({
      root: props.mainTree ? [tree.idxOfFilteredRoot, undefined] : [undefined, tree.idxOfFilteredRoot]
    }));
  }

  function zoomBack(): void {
    // Zoom out of main tree as long as we're not showing everything
    let rootIdx: number;
    if (tree.idxOfInViewRootNode !== 0) {
      const rootNode = tree.nodes[tree.idxOfInViewRootNode];
      if (props.mainTree && props.showStreamTrees && rootNode.inStream && !!tree.streams[rootNode.streamName].parentStreamName) {
        rootIdx = getParentStream(rootNode).arrayIdx;
      } else {
        rootIdx = getParentBeyondPolytomy(rootNode, props.distanceMeasure, tree.observedMutations).arrayIdx;
      }
    }
    props.dispatch(updateVisibleTipsAndBranchThicknesses({
      root: props.mainTree ? [rootIdx, undefined] : [undefined, rootIdx]
    }));
  }

  function redrawTree(): void {
    const root: Root = props.mainTree ? [0, undefined] : [undefined, 0];
    props.dispatch(updateVisibleTipsAndBranchThicknesses({root}));
  }
}
