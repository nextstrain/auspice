import { numericToCalendar } from "../../util/dateHelpers";
import { months } from "../../util/globals";
import { getVisibleDateRange, getNumSelectedTips } from "../../util/treeVisibilityHelpers";

const plurals = {
  country: "countries",
  authors: "authors"
};

export const pluralise = (word, n) => {
  if (n === 1) {
    if (word === "authors") word = "author";
  } else {
    if (word in plurals) word = plurals[word];
    if (word.slice(-1).toLowerCase() !== "s") word+="s";
  }
  word = word.replace(/_/g, " ");
  return word;
};

export const styliseDateRange = (date) => {
  const dateStr = (typeof date === "number") ?
    numericToCalendar(date) :
    date;
  const fields = dateStr.split('-');
  // 2012-01-22
  if (fields.length === 3) {
    return `${months[fields[1]]} ${fields[0]}`;
  }
  // other cases like negative numbers
  return dateStr;
};

/**
 * @returns {string}
 */
export const datasetSummary = ({nodes, visibility, mainTreeNumTips, branchLengthsToDisplay, t}) => {
  const nSelectedSamples = getNumSelectedTips(nodes, visibility);
  const sampledDateRange = getVisibleDateRange(nodes, visibility);
  let summary = ""; /* text returned from this function */

  /* Number of genomes & their date range */
  if (branchLengthsToDisplay !== "divOnly" && nSelectedSamples > 0) {
    summary += t(
      "Showing {{x}} of {{y}} genomes sampled between {{from}} and {{to}}",
      {
        x: nSelectedSamples,
        y: mainTreeNumTips,
        from: styliseDateRange(sampledDateRange[0]),
        to: styliseDateRange(sampledDateRange[1])
      }
    );
  } else {
    summary += t(
      "Showing {{x}} of {{y}} genomes",
      {x: nSelectedSamples, y: mainTreeNumTips}
    );
  }
  summary += ".";
  return summary;
};
