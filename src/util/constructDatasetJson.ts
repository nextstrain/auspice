import { metadataStateToJson } from "./metadataJsonParsing";
import type { RootState } from "../store";
import type { ReduxNode, TreeState } from "../reducers/tree/types";
import type { Metadata } from "../reducers/metadata.types.ts";

/**
 * The DatasetJson is loosely typed (i.e. lots of `any` types) on purpose:
 * Use use `unknown` types for the JSON when we parse it, using run-time
 * checks to ensure the data is as expected (and thus the redux state can
 * be properly typed). Rather than use exhaustive types here for writing it
 * we rely on jest tests to give us confidence.
 */
interface DatasetJson {
  version: "v2";
  meta: Record<string, any>;
  tree: Record<string, any> | Array<Record<string, any>>;
  root_sequence?: Record<string, string>;
}


/**
 * Turn redux state into an Auspice dataset JSON representing the main
 * tree. Sidecars and second (RHS) trees are not handled.
 */
export function createDatasetJson(getState: () => RootState): DatasetJson {
  const reduxState = getState();
  const rootSequence = handleRootSequences(reduxState.metadata);
  const json = {
    version: "v2" as const,
    meta: metadataStateToJson(reduxState),
    tree: treeStateToJson(reduxState.tree),
    ...(rootSequence && { root_sequence: rootSequence}),
  };
  return json
}



/**
 * Inverse of treeJsonToState: reconstructs the nested JSON tree
 * from the Redux tree state
 */
function treeStateToJson(tree: TreeState): object | object[] {
  //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const root = tree.nodes![0]; // synthetic __ROOT

  const cleanNode = (node: ReduxNode): object => {
    const cleaned: Record<string, unknown> = {};
    if (node.name) cleaned.name = node.name;
    if (node.node_attrs) cleaned.node_attrs = node.node_attrs;
    if (node.branch_attrs) cleaned.branch_attrs = node.branch_attrs;
    if (node.children?.length) {
      cleaned.children = node.children.map(cleanNode);
    }
    return cleaned;
  };

  const trees = (root.children || []).map(cleanNode);
  return trees.length === 1 ? trees[0] : trees;
}


/**
 * Returns a root sequence object (if present). There are two limitations with the
 * current implementation:
 *  - We don't know if the root sequence originated from the main JSON or a sidecar JSON
 *  - We don't handle the root sequence of a second (RHS) tree
 */
function handleRootSequences(
  metadata: Metadata
): Metadata['rootSequence'] {
  if (metadata.rootSequence) {
    return metadata.rootSequence;
  }
  return undefined;
}
