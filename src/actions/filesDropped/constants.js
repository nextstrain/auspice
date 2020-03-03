/*
    Defines acceptable file types for the auspice drag & drop functionality.
*/

const csv_file_types = ["text/csv", "application/vnd.ms-excel"];

// Add MacOS & Linux .tsv to accepted file types
const accepted_file_types = csv_file_types.concat("text/tab-separated-values");

// Handle Windows .tsv edge case with empty file type
const is_windows_tsv = (file) => file.type === "" && file.name.endsWith('.tsv');

const is_csv_or_tsv = (file) => accepted_file_types.includes(file.type) || is_windows_tsv(file);

export {
  csv_file_types,
  is_csv_or_tsv
};
