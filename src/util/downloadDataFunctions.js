/* eslint no-restricted-syntax: 0 */

export const CSV = (nodes) => {
  console.log("download metadata csv");

  /* TODO
   * TRIGGER SUCCESS / ERROR NOTIFICATION
   * FILENAME BASED ON DATASET NAME
   * DONT HARDCODE ATTRS
   */

  // dont need to traverse the tree - can just loop the nodes
  const hardcodedAttrsTemp = ["country", "authors", "accession", "num_date", "region", "date"];
  const hardcodedFNameTemp = "nextstrain_metadata.csv";
  const data = [];
  for (const node of nodes) {
    if (node.hasChildren) {
      continue;
    }
    const line = [node.strain];
    for (const field of hardcodedAttrsTemp) {
      if (Object.keys(node.attr).indexOf(field) === -1) {
        line.push("unknown");
      } else {
        line.push(node.attr[field]);
      }
    }
    data.push(line);
  }
  const lineArray = [["strain"].concat(hardcodedAttrsTemp)];
  data.forEach((line) => {
    const lineString = line.join(",");
    lineArray.push(lineString);
  });
  const csvContent = lineArray.join("\n");
  /* via https://stackoverflow.com/questions/18848860/javascript-array-to-csv/18849208#comment59677504_18849208 */
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", hardcodedFNameTemp);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const newick = () => {
  console.log("download newick");
};

export const nexus = () => {
  console.log("download nexus");
};

export const SVG = () => {
  console.log("download SVG");
};
