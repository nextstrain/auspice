import { numericToCalendar } from "../../util/dateHelpers";
import { months } from "../../util/globals";
import { getVisibleDateRange, getNumSelectedTips } from "../../util/treeVisibilityHelpers";

const plurals = {
  country: "countries",
  authors: "authors"
};

export const pluralise = (word, n) => {
  if (n === 1) {
    if (word === "authors") word = "author"; // eslint-disable-line
  } else {
    if (word in plurals) word = plurals[word]; // eslint-disable-line
    if (word.slice(-1).toLowerCase() !== "s") word+="s"; // eslint-disable-line
  }
  word = word.replace(/_/g, " "); // eslint-disable-line
  return word;
};

const arrayToSentence = (arr, {prefix=undefined, suffix=undefined, capatalise=true, fullStop=true}={}) => {
  let ret;
  if (!arr.length) return '';
  if (arr.length === 1) {
    ret = arr[0];
  } else {
    ret = arr.slice(0, -1).join(", ") + " and " + arr[arr.length-1];
  }
  if (prefix) ret = prefix + " " + ret;
  if (suffix) ret += " " + suffix;
  if (capatalise) ret = ret.charAt(0).toUpperCase();
  if (fullStop) ret += ".";
  return ret + " ";
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
export const datasetSummary = ({nodes, visibility, mainTreeNumTips, branchLengthsToDisplay, filters, visibleStateCounts, t}) => {
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

  /* parse filters */
  const filterTextArr = [];
  Object.keys(filters).forEach((filterName) => {
    const n = Object.keys(visibleStateCounts[filterName]).length;
    if (!n) return;
    filterTextArr.push(`${n} ${pluralise(filterName, n)}`);
  });
  const prefix = t("Comprising");
  const filterText = arrayToSentence(filterTextArr, {prefix: prefix, capatalise: false});
  if (filterText.length) {
    summary += ` ${filterText}`;
  } else if (summary.endsWith('.')) {
    summary += " ";
  } else {
    summary += ". ";
  }
  return summary;
};
