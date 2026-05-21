import { errorNotification, successNotification } from "../notifications";
import { fileTypeIsCSVLike, fileTypeIsJson } from "./constants";
import { handleCsvLikeDroppedFile } from "./parseCsv";
import { handleNodeDataJsonFile } from "./parseNodeDataJson";
import { updateMetadata, SUCCESS } from "../updateMetadata/updateMetadata";
import { AppDispatch, RootState } from "../../store";
import { NewMetadata } from "../updateMetadata/updateMetadata.types"


/**
 * A thunk to handle dropped files and take the appropriate action.
 * Exported for use by auspice.us
 */
export const handleFilesDropped = (files: FileList) => async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
  const { tree, treeToo } = getState();
  const nodeNames = _collectNodeNames(tree, treeToo);

  for (const file of files) {
    try {
      let newMetadata: NewMetadata;
      if (fileTypeIsCSVLike(file)) {
        newMetadata = await handleCsvLikeDroppedFile(file, nodeNames);
      } else if (fileTypeIsJson(file)) {
        newMetadata = await handleNodeDataJsonFile(file, nodeNames);
      } else {
        // console.error("[internal logic error] unhandled file type");
        dispatch(errorNotification({
          message: `Parsing of '${file.name}' failed`,
          details: `Unhandled file type`,
        }))
        continue;
      }
      const result = dispatch(updateMetadata(newMetadata));
      if (result===SUCCESS) {
        dispatch(successNotification({
          message: `Adding metadata from ${file.name}`,
          // @ts-expect-error TS2769 — untyped property access in complex structures      
    details: `n = ${Object.keys(newMetadata.attributes).length} fields(s)`,
        }));
      } else {
        throw Error(result);
      }
    } catch (err) {
      console.error(err)
      dispatch(errorNotification({
        message: `Parsing of '${file.name}' failed`,
        details: err instanceof Error ? err.message : String(err),
      }))
    }
  }
};

export default handleFilesDropped;


/**
 * Return a set of all node names found across both trees
 */
function _collectNodeNames(tree: RootState['tree'], treeToo: RootState['treeToo']): Set<string> {
  const names = new Set(tree.nodes!.map((n) => n.name!)); // can be internal nodes
  if (Array.isArray(treeToo.nodes)) {
    treeToo.nodes.forEach((node) => names.add(node.name!));
  }
  return names;
}
