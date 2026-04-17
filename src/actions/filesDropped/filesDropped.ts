import { errorNotification } from "../notifications";
import { fileTypeIsCSVLike, fileTypeIsJson, isAcceptedFileType } from "./constants";
import { handleCsvLikeDroppedFile } from "./parseCsv";
import { handleNodeDataJsonFile } from "./parseNodeDataJson";
import { updateMetadata } from "../updateMetadata/updateMetadata";
import { AppDispatch, RootState } from "../../store";
import { NewMetadata } from "../updateMetadata/updateMetadata.types"


/**
 * A thunk to handle dropped files and take the appropriate action.
 * Exported for use by auspice.us
 */
export const handleFilesDropped = (files: FileList) => async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {

  const acceptedFiles = [...files].filter(isAcceptedFileType);
  const failures: string[] = [];

  if (acceptedFiles.length !== files.length) {
    [...files]
      .filter((file) => !acceptedFiles.includes(file))
      .forEach((file) => {
        failures.push(`'${file.name}' (invalid file type)`);
      });
  }

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
        console.error("[internal logic error] unhandled file type");
        continue;
      }
      dispatch(updateMetadata(newMetadata));
    } catch (err) {
      console.error(err)
      failures.push(`'${file.name}' (parsing failed)`);
    }
  }

  if (failures.length) {
    dispatch(errorNotification({
      message: `At least one dropped file had failures`,
      details: failures.join(", "),
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
