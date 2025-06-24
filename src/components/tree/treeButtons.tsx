import React, {ReactElement} from "react";
import { FaSearchMinus } from "react-icons/fa";
import { Root, updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";
import { getParentBeyondPolytomy, getParentStream } from "./phyloTree/helpers";
import { tabSingle, darkGrey, lightGrey } from "../../globalStyles";
import { TreeComponentProps } from "./types";


export function TreeButtons(props: TreeComponentProps): ReactElement {
  if (props.narrativeMode) {
    return null; // hide the buttons when viewing a narrative to prevent tree manipulations
  }

  const filteredTree = !!props.tree.idxOfFilteredRoot &&
    props.tree.idxOfInViewRootNode !== props.tree.idxOfFilteredRoot;
  const filteredTreeToo = !!props.treeToo.idxOfFilteredRoot &&
    props.treeToo.idxOfInViewRootNode !== props.treeToo.idxOfFilteredRoot;
  const activeZoomButton = filteredTree || filteredTreeToo;
  const anyTreeZoomed = props.tree.idxOfInViewRootNode !== 0 ||
    props.treeToo.idxOfInViewRootNode !== 0;

  const containerStyles: React.CSSProperties = {zIndex: 100, position: "absolute", right: 5, top: 0};
  const baseButtonStyles: React.CSSProperties = {...tabSingle, zIndex: 100, display: "inline-block", marginLeft: "4px"};
  const selectedButtonStyles: React.CSSProperties = {...baseButtonStyles, cursor: "pointer", color: darkGrey, pointerEvents: "auto"};
  const unselectedButtonStyles: React.CSSProperties = {...baseButtonStyles, cursor: "auto", color: lightGrey, pointerEvents: "none"};

  return (
    <div style={containerStyles}>
      
      <button style={anyTreeZoomed ? selectedButtonStyles : unselectedButtonStyles} onClick={zoomBack}>
        <FaSearchMinus/>
      </button>

      <button style={activeZoomButton ? selectedButtonStyles : unselectedButtonStyles} onClick={zoomToSelected}>
        {props.t("Zoom to Selected")}
      </button>

      <button style={anyTreeZoomed ? selectedButtonStyles : unselectedButtonStyles} onClick={redrawTree}>
        {props.t("Zoom to Root")}
      </button>

    </div>
  );

  function zoomToSelected(): void {
    props.dispatch(updateVisibleTipsAndBranchThicknesses({
      root: [props.tree.idxOfFilteredRoot, props.treeToo.idxOfFilteredRoot]
    }));
  }

  function zoomBack(): void {
    const root: Root = [undefined, undefined];
    // Zoom out of main tree if index of root node is not 0
    if (props.tree.idxOfInViewRootNode !== 0) {
      const rootNode = props.tree.nodes[props.tree.idxOfInViewRootNode];
      if (props.showStreamTrees && rootNode.inStream && !!props.tree.streams[rootNode.streamName].parentStreamName) {
        root[0] = getParentStream(rootNode).arrayIdx;
      } else {
        root[0] = getParentBeyondPolytomy(rootNode, props.distanceMeasure, props.tree.observedMutations).arrayIdx;
      }
    }
    // Also zoom out of second tree if index of root node is not 0
    // (don't have to consider stream trees as they're not possible for the second tree)
    if (props.treeToo.idxOfInViewRootNode !== 0) {
      const rootNodeToo = props.treeToo.nodes[props.treeToo.idxOfInViewRootNode];
      root[1] = getParentBeyondPolytomy(rootNodeToo, props.distanceMeasure, props.treeToo.observedMutations).arrayIdx;
    }
    props.dispatch(updateVisibleTipsAndBranchThicknesses({root}));
  }

  function redrawTree(): void {
    props.dispatch(updateVisibleTipsAndBranchThicknesses({root: [0, 0]}));
  }
}
