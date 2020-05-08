import queryString from "query-string"; // eslint-disable-line import/no-extraneous-dependencies
import { fetchDataAndDispatch } from "../../../src/actions/loadData";

export const getDatasetAndDispatch = (dispatch, blocks) => {
  const firstURL = blocks[0].dataset;
  const firstQuery = queryString.parse(blocks[0].query);
  fetchDataAndDispatch(dispatch, firstURL, firstQuery, blocks);
};

export const getNarrativeMarkdown = (prefix) => {
  const path = `/charon/dev/getNarrativeMarkdown?prefix=${prefix}`;
  const p = fetch(path)
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(res.statusText);
      }
      return res;
    })
    .then((res) => res.text());
  return p;
};

