import React from "react";

/**
 * Convert string or number, often with underscores etc, into a form for display
 * @param {string|int} x one of .tip or .branch
 * @param {bool} multiplier (default: false) add multiplier symbol to end
 * @param {int} trim (default: 0) should strings get trimmed? Applies only to strings. 0: no trimming.
 * @returns {string|float} to display
 */
export const prettyString = (x, {multiplier = false, trim = 0, camelCase = true, removeComma = false, stripEtAl = false} = {}) => {
  if (!x && x!== 0) {
    return "";
  }
  if (typeof x === "string") {
    if (trim > 0 && x.length > trim) {
      x = x.slice(0, trim) + "...";
    }
    if (["usvi", "usa", "uk"].indexOf(x.toLowerCase()) !== -1) {
      return x.toUpperCase();
    }
    x = x.replace(/_/g, " ");
    if (camelCase) {
      x = x.replace(/\w\S*/g, (y) => y.charAt(0).toUpperCase() + y.substr(1).toLowerCase());
    }
    if (removeComma) {
      x = x.replace(/,/g, "");
    }
    if (stripEtAl) {
      x = x.replace('et al.', '').replace('Et Al.', '').replace('et al', '').replace('Et Al', '');
    }
    return x;
  } else if (typeof x === "number") {
    const val = parseFloat(x);
    const magnitude = Math.ceil(Math.log10(Math.abs(val) + 1e-10));
    return multiplier ? val.toFixed(5 - magnitude) + "\u00D7" : val.toFixed(5 - magnitude);
  }
  return x;
};

export const authorString = (x) => {
  const y = prettyString(x);
  if (y.indexOf("Et Al") !== -1) {
    return (<span>{y.replace(" Et Al", "")}<em> et al</em></span>);
  }
  return y;
};

export const formatURLString = (x) => {
  let url = x;
  if (url.startsWith("https_")) {
    url = url.replace(/^https_/, "https:");
  } else if (url.startsWith("http_")) {
    url = url.replace(/^https_/, "http:");
  }
  return url;
};
