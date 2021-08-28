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

const isAcceptedFileType = (file) => acceptedFileTypes.includes(file.type) || isWindowsTsv(file) || isExcelCsv(file);

export {
  isAcceptedFileType
};
