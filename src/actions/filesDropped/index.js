import { warningNotification } from "../notifications";
import handleMetadata from "./metadata";
import { is_csv_or_tsv } from "./constants";


/**
 * A thunk to handle dropped files and take the appropriate action.
 * @param {*} files DataTransfer object's FileList
 */
const handleFilesDropped = (files) => (dispatch, getState) => {

  if (files.length !== 1) {
    return dispatch(warningNotification({
      message: "More than one file dropped",
      details: "Currently we only allow a single CSV to be used"
    }));
  }

  const file = files[0];

  if (is_csv_or_tsv(file)) {
    return handleMetadata(dispatch, getState, file);
  }

  return dispatch(warningNotification({
    message: `Cannot parse ${file.name}`,
    details: `Currently only CSV & TSV files are allowed, not ${file.type}`
  }));
};

export default handleFilesDropped;
