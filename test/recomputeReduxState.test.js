/**
 * @jest-environment jsdom
 */
/* NOTE: We use the jsdom environment since `createStateFromQueryOrJSONs` relies on `window` */

import { createStateFromQueryOrJSONs } from "../src/actions/recomputeReduxState";
import genericMainJson from './data/generic.json';

/**
 * The `createStateFromQueryOrJSONs` function is a large and complex function used at dataset load time
 * as well as to effect narrative slide changes. The aim here is to test it on a number of datasets and
 * different ways the function can be called. Simply testing that the function returns an object (i.e.
 * doesn't throw) is enough to start with, as there's only a single return point in the function.
 * 
 * Future directions:
 * - assert dispatch is called in certain circumstances
 * - check console logs (console.error's are expected in many circumstances)
 * - create a similar test for sidecar files
 * - consider using these datasets to smoke test via playright
 * - create state then call `createStateFromQueryOrJSONs` again
 */


/**
 * Define a list of dataset permutations, each element being an array with
 * a short description (string) and a function which takes in the mainDataset (object)
 * and returns a modified version.
 */
const datasetPermutationSpecifications = [
  ["generic dataset JSON", (dataset) => dataset],
  ..._modifyJsonToRemoveOptionalMetaKeys(),
  ..._modifyJsonToRemoveOptionalDisplayDefaultKeys(),
]

function* datasetPermutations() {
  for (const [summary, modify] of datasetPermutationSpecifications) {
    yield [summary, modify(clone(genericMainJson))]
  }
}


/**
 * Run through each permutation of the dataset and turn it into react state
 * via the simplest possible call to `createStateFromQueryOrJSONs`
 */
for (const [summary, mainDataset] of datasetPermutations()) {
  it(`Basic redux state creation for: ${summary}`, () => {
    const state = createStateFromQueryOrJSONs({
      json: mainDataset,
      query: {},
      dispatch,
    })
    expect(state).toBeInstanceOf(Object)
  })
}

/**
 * Test two-trees
 */
for (const [summary, modifiedDataset] of datasetPermutations()) {
  it(`Basic redux state creation for two trees: generic + ${summary}`, () => {
    const state = createStateFromQueryOrJSONs({
      json: modifiedDataset,
      query: {},
      dispatch,
    })
    expect(state).toBeInstanceOf(Object)
  })
}


function _modifyJsonToRemoveOptionalMetaKeys() {
  return Object.keys(genericMainJson['meta']) // all are optional in the schema
  .filter(() => true)  // NOTE: the schema requires "updated", "panels", but auspice can handle cases where these are missing
  .map((key) => [
    `missing .meta key "${key}"`,
    (dataset) => {
      delete dataset['meta'][key];
      return dataset
    }
  ])
}



function _modifyJsonToRemoveOptionalDisplayDefaultKeys() {
  // Since the dataset works without the `display_defaults` object at all, this seems a little unnecessary,
  // but I guess there's no harm?
  return Object.keys(genericMainJson['meta']['display_defaults']) // all are optional in the schema
  .filter(() => true)  // all are optional in the schema
  .map((key) => [
    `missing .meta.display_default key "${key}"`,
    (dataset) => {
      delete dataset['meta']['display_defaults'][key];
      return dataset
    }
  ])
}


function dispatch() {
  /* no-op */
}

/**
 * Clone a (JSON) dataset. We can't use the native `window.structuredClone`
 * because we're in a jsdom test environment, and we can't polyfill it without
 * updating our version of core-js (structuredClone added in v3.20.0). Since the
 * dataset is originally JSON it's fine to use the classic stringify-parse approach.
 */
function clone(dataset) {
  return JSON.parse(JSON.stringify(dataset))
}