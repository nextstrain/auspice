import { errorNotification } from "../notifications";
import { fileTypeIsCSVLike } from "./constants";
import { handleCsvLikeDroppedFile } from "./parseCsv";
import { updateMetadata } from "../updateMetadata/updateMetadata";
import { AppDispatch, RootState } from "../../store";
import { NewMetadata } from "../updateMetadata/updateMetadata.types"


/**
 * A thunk to handle dropped files and take the appropriate action.
 * Exported for use by auspice.us
 */
export const handleFilesDropped = (files: FileList) => async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {

  if (files.length !== 1) {
    dispatch(errorNotification({
      message: "More than one file dropped",
      details: "Currently we only allow a single CSV to be used"
    }));
    return;
  }

  const file = files[0];

  const { tree, treeToo } = getState();
  const nodeNames = _collectNodeNames(tree, treeToo);

  try {
    let newMetadata: NewMetadata;
    if (fileTypeIsCSVLike(file)) {
      newMetadata = await handleCsvLikeDroppedFile(file, nodeNames);
    } else {
      dispatch(errorNotification({
        message: `Cannot parse ${file.name}`,
        details: `Currently only CSV/TSV/XLSX files are allowed, not ${file.type}`
      }));
      return;
    }

    dispatch(updateMetadata(newMetadata));
  } catch (err) {
    console.error(err)
    dispatch(errorNotification({
      message: `Parsing of '${file.name}' failed`,
      details: err instanceof Error ? err.message : String(err),
    }))
  }

};

export default handleFilesDropped;


/**
 * Return a set of all node names found across both trees
 */
function _collectNodeNames(tree: RootState['tree'], treeToo: RootState['treeToo']): Set<string> {
  const names = new Set(tree.nodes.map((n) => n.name)); // can be internal nodes
  if (Array.isArray(treeToo.nodes)) {
    treeToo.nodes.forEach((node) => names.add(node.name));
  }
  return names;
}
