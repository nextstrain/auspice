import {useEffect, useReducer, useRef} from "react";
import { useDispatch } from 'react-redux';
import { CACHE_JSONS } from "../../actions/types";

/**
 * The auspice architecture includes a cache of datasets (main + sidecars)
 * from which the visualisation loads and from which it can change datasets
 * within narrative slides. The datasets in the cache are stored as promises
 * which will return the data. Within the narrative debugger we want to have
 * more flexibility especially as it pertains to failed dataset loads (e.g.
 * was it the fetch, or the parsing?) which is why this logic is decoupled
 * from the cache itself.
 */

export function useDatasetFetch(datasets) {
  const dispatchRedux = useDispatch();
  const [datasetResponses, dispatchDatasetResponses] = useReducer(
    (state, action) => {
      if (action.reset) return {};
      const s = {...state}; // nested objects refs unchanged
      // console.log("reducer - action received!", action);
      if (!s[action.name]) {
        s[action.name] = {main: "notAttempted", rootSeq: "notAttempted", frequencies: "notAttempted"};
      }
      s[action.name] = {...s[action.name]}; // give the dataset a new ref
      s[action.name][action.datasetType] = action.status;
      return s;
    },
    {}
  );
  /* we only want to fire useEffect when the dataset names have changed (e.g. new markdown dragged on)
  and the way to do this in hooks is a little bit complicated */
  const previousDatasetNames = useRef(Object.keys(datasets || {}));

  useEffect(() => {
    const currentDatasetNames = Object.keys(datasets || {});
    if (JSON.stringify(currentDatasetNames)===JSON.stringify(previousDatasetNames.current)) {
      return;
    }
    dispatchDatasetResponses({reset: true}); // clear any previous responses
    previousDatasetNames.current = currentDatasetNames;
    for (const name of Object.keys(datasets || {})) {
      if (!datasetResponses[name] || datasetResponses[name].main==="notAttempted") {
        fetchDatasetAndSidecars(name, datasets[name], dispatchDatasetResponses); // returns a promise
      }
    }
    dispatchRedux({type: CACHE_JSONS, jsons: datasets});
    /** NOTE: datasets[name].main will be a promise (not yet resolved), but the sidecars won't actually
     *  exist yet (e.g. datasets[name].rootSequence isn't set). They _may_ be set later on by,
     *  however this won't trigger a redux update. I don't think this is a problem in practice, but
     *  it's certainly an anti-pattern */
  }, [dispatchRedux, dispatchDatasetResponses, datasets, datasetResponses, previousDatasetNames]);
  return datasetResponses;
}

async function fetchDatasetAndSidecars(name, dataset, dispatchDatasetResponses) {
  /* step 1: fetch the main */
  dispatchDatasetResponses({name, datasetType: 'main', status: 'inProgress'});
  dataset.fetchMain(); // sets dataset.main to be a promise
  try {
    await dataset.main;
    /**
     * dataset.main is a promise to the JSON. Failures to parse the JSON file (but not our schema)
     * will raise an error here, but we still need to check that the JSON is valid! TODO
     */
    dispatchDatasetResponses({name, datasetType: 'main', status: 'success'});
  } catch (err) {
    console.error(`\tMainFetch has failed for ${name} and so sidecars will not be requested`);
    // the statuses for sidecars will not change from their default, i.e. `notAttempted`
    dispatchDatasetResponses({name, datasetType: 'main', status: `Error: ${err.message}`});
    return;
  }

  try {
    await dataset.fetchSidecars();
    /** fetchSidecars sets up promises for the sidecar files _after_ waiting
     *  for the main dataset to arrive (resolve), but it doesn't wait for the
     *  sidecar promises to resolve.
     *
     *  The contents of the sidecars are not validated (further than simple JSON validation
     *  via res.JSON(). Neither are they dispatched -- this only matters if the debugger is
     *  actually visualising the dataset when the promise resolves (as if its resolved when the
     *  dataset viz loads then it'll access the promise), which is an edge case we don't need
     *  to address (yet).
     * TODO the above isn't true! The sidecar file doesn't load :(
     */

    /* rootSequence is always attempted, and resolves to undefined on fetch failure or the JSON on success. */
    dispatchDatasetResponses({name, datasetType: 'rootSeq', status: 'inProgress'});
    dataset.rootSequence.then((rootSeqData) => {
      if (rootSeqData) {
        dispatchDatasetResponses({name, datasetType: 'rootSeq', status: 'success'});
      } else {
        dispatchDatasetResponses({name, datasetType: 'rootSeq', status: 'Warning - could not fetch the root sequence sidecar file. This is not necessarily a problem!'});
      }
    });

    /* tipFrequencies is NOT fetched unless the dataset asks to display it. If attempted,
       it resolves to undefined on fetch failure or the JSON on success. */
    if (dataset.tipFrequencies) {
      dispatchDatasetResponses({name, datasetType: 'frequencies', status: 'inProgress'});
      dataset.tipFrequencies.then((tipFreqData) => {
        if (tipFreqData) {
          dispatchDatasetResponses({name, datasetType: 'frequencies', status: 'success'});
        } else {
          dispatchDatasetResponses({name, datasetType: 'frequencies', status: 'Error - the dataset requested a tipFrequencies sidecar but the fetch failed'});
        }
      });
    } else {
      // TODO -- expand on status messaging here.
    }


  } catch (err) {
    console.error("Programming error within fetchDatasetAndSidecars", err);
  }
}

