import { csv_file_types, is_csv_or_tsv } from "./constants";

let Papa; /* lazyily imported once a file is dropped on */

/**
 * A promise-ified version of Papa.parse()
 * A note on encoding here: It will be common that people drop CSVs from microsoft excel
 * in here annd, you guessed it, this causes all sorts of problems.
 * https://github.com/mholt/PapaParse/issues/169 suggests adding encoding: "ISO-8859-1"
 * to the config, which may work
 * @param {DataTransfer} file a DataTransfer object
 */
export const parseCsvTsv = async (file) => {
  if (!Papa) Papa = (await import("papaparse")).default;
  return new Promise((resolve, reject) => {
    if (!(is_csv_or_tsv(file))) {
      reject(new Error("Cannot parse this filetype"));
    }
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      },
      encoding: "UTF-8",
      comments: "#",
      delimiter: (csv_file_types.includes(file.type)) ? "," : "\t",
      skipEmptyLines: true,
      dynamicTyping: false
    });
  });
};

