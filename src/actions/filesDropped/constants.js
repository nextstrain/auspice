/*
    Defines acceptable file types for the auspice drag & drop functionality.
*/

const acceptedFileTypes = [
  "text/csv",
  "text/tab-separated-values",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

// Handle Windows .tsv edge case with empty file type
const isWindowsTsv = (file) => file.type === "" && file.name.endsWith('.tsv');

// Handle Excel exported .csv files
const isExcelCsv = (file) => file.type === "application/vnd.ms-excel" && file.name.endsWith('.csv');

const fileTypeIsCSVLike = (file) => acceptedFileTypes.includes(file.type) || isWindowsTsv(file) || isExcelCsv(file);

const fileTypeIsJson = (file) => file.type === "application/json" || file.name.endsWith('.json');

/** Used by auspice.us */
function isAcceptedFileType(file) {
  return fileTypeIsCSVLike(file) || fileTypeIsJson(file);
}

export {
  fileTypeIsCSVLike,
  fileTypeIsJson,
  isAcceptedFileType
};
