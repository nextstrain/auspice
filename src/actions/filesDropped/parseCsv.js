let Papa; /* lazyily imported once a file is dropped on */

/**
 * A promise-ified version of Papa.parse()
 * A note on encoding here: It will be common that people drop CSVs from microsoft excel
 * in here and, you guessed it, this causes all sorts of problems.
 * https://github.com/mholt/PapaParse/issues/169 suggests adding encoding: "ISO-8859-1"
 * to the config, which may work
 * @param {string} csvString a string of delimited text
 */
export const parseCsv = async (csvString) => {
  if (!Papa) Papa = (await import("papaparse")).default;
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      },
      encoding: "UTF-8",
      comments: "#",
      delimiter: ",",
      skipEmptyLines: true,
      dynamicTyping: false
    });
  });
};

