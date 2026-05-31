/**
 * @jest-environment jsdom
 */

/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { configureStore } from '@reduxjs/toolkit';
import rootReducer from "../src/reducers";
import { createStateFromQueryOrJSONs } from "../src/actions/recomputeReduxState";
import { createDatasetJson } from "../src/util/constructDatasetJson";
import { changeColorBy } from "../src/actions/colors.js";
import { changeLayout } from "../src/actions/layout.js";
import { updateVisibleTipsAndBranchThicknesses } from "../src/actions/tree";
import { toggleStreamTree } from "../src/actions/treeStreams";
import { togglePanelDisplay } from "../src/actions/panelDisplay.js";
import { CLEAN_START, CHANGE_DISTANCE_MEASURE, TOGGLE_TRANSMISSION_LINES, CHANGE_GEO_RESOLUTION, CHANGE_BRANCH_LABEL, CHANGE_LANGUAGE, CHANGE_TIP_LABEL_KEY } from "../src/actions/types";
import genericDataset from "./data/generic.json";

/* P.S. provision these (non-git-committed) dataset JSONs via `npm run fetch-test-data` */
// @ts-ignore This will fail type-check if the JSONs haven't been fetched
import ebov2013 from './fetched-jsons/ebola-ebov-2013.json';

function clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createTestStore(originalJson) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  });
  const cleanStartState = createStateFromQueryOrJSONs({
    json: clone(originalJson) as any, query: {}, dispatch: store.dispatch,
  });
  store.dispatch({ type: CLEAN_START, ...cleanStartState });
  return store;
}

type TestStore = ReturnType<typeof createTestStore>;

function recreateDisplayDefaultsJson(store: TestStore): Record<string, any> {
  return createDatasetJson(store.getState).meta.display_defaults;
}

describe("Downloaded JSON's display_defaults reflect dynamic redux state (Ebola 2013 tree)", () => {
  let store: TestStore;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    store = createTestStore(ebov2013);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("baseline: without any modifications, display_defaults is as expected", () => {
    const display_defaults = recreateDisplayDefaultsJson(store); // round-tripped through redux state
    expect(display_defaults.layout).toBeUndefined(); // not in the JSON
    expect(display_defaults.color_by).toEqual('division');
  });


  it("Changing layout sets display_defaults.layout", () => {
    store.dispatch(changeLayout({ layout: 'radial' } as any))
    expect(recreateDisplayDefaultsJson(store).layout).toEqual("radial");
  });

  it("Changing color to num_date sets display_defaults.color_by = num_date", () => {
    store.dispatch(changeColorBy('num_date'));
    expect(recreateDisplayDefaultsJson(store).color_by).toEqual("num_date");
  });

  it("Changing color to country (Auspice hardcoded default) removes display_defaults.color_by", () => {
    store.dispatch(changeColorBy('country'));
    expect(recreateDisplayDefaultsJson(store).color_by).toBeUndefined();
  });

  it("Changing distance_measure to 'div' sets display_defaults.distance_measure = div", () => {
    store.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: 'div' });
    expect(recreateDisplayDefaultsJson(store).distance_measure).toEqual("div");
  });

  it("Changing distance_measure back to 'num_date' removes display_defaults.distance_measure", () => {
    store.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: 'num_date' });
    expect(recreateDisplayDefaultsJson(store).distance_measure).toBeUndefined();
  });

  it("Changing geographic resolution to 'country' removes display_defaults.geo_resolution", () => {
    store.dispatch({ type: CHANGE_GEO_RESOLUTION, data: 'country' });
    expect(recreateDisplayDefaultsJson(store).geo_resolution).toBeUndefined();
  });

  it("Changing geographic resolution back to 'division' sets display_defaults.geo_resolution = division", () => {
    store.dispatch({ type: CHANGE_GEO_RESOLUTION, data: 'division' });
    expect(recreateDisplayDefaultsJson(store).geo_resolution).toEqual('division');
  });

  it("Changing branch label to 'aa' sets display_defaults.branch_label = 'aa'", () => {
    store.dispatch({ type: CHANGE_BRANCH_LABEL, value: 'aa' });
    expect(recreateDisplayDefaultsJson(store).branch_label).toEqual('aa');
  });

  it("Changing tip label to 'country' sets display_defaults.tip_label = 'country'", () => {
    store.dispatch({ type: CHANGE_TIP_LABEL_KEY, key: 'country' });
    expect(recreateDisplayDefaultsJson(store).tip_label).toEqual('country');
  });

  it("Changing tip label to 'country' sets display_defaults.tip_label = 'country'", () => {
    store.dispatch({ type: CHANGE_TIP_LABEL_KEY, key: 'country' });
    expect(recreateDisplayDefaultsJson(store).tip_label).toEqual('country');
  });

  it("Changing language to Spanish sets display_defaults.language = 'es'", () => {
    store.dispatch({ type: CHANGE_LANGUAGE, data: 'es' });
    expect(recreateDisplayDefaultsJson(store).language).toEqual('es');
  });

  it("Toggling off 'show transmission lines' sets display_defaults.transmission_lines = false", () => {
    store.dispatch({ type: TOGGLE_TRANSMISSION_LINES, data: false });
    expect(recreateDisplayDefaultsJson(store).transmission_lines).toEqual(false);
  });

  it("Toggling off map panel removes it from display_defaults", () => {
    store.dispatch(togglePanelDisplay('map'));
    expect(recreateDisplayDefaultsJson(store).panels).not.toContain('map');
    expect(recreateDisplayDefaultsJson(store).panels).toContain('tree');
  });

});


/**
 * The generic.json has branch labels to test stream trees & label defaults
 */
describe("Downloaded JSON's display_defaults reflect dynamic redux state (generic.json tree)", () => {
  let store: TestStore;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    store = createTestStore(genericDataset);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("baseline: without any modifications, display_defaults is as expected", () => {
    const display_defaults = recreateDisplayDefaultsJson(store); // round-tripped through redux state
    expect(display_defaults.branch_label).toEqual('node_name');
    expect(display_defaults.label).toEqual('node_name:alpha');
    expect(display_defaults.tip_label).toEqual('subtree');
    expect(display_defaults.stream_label).toEqual('river');
  });

  it("Toggling off stream-trees removes display_defaults.stream_label", () => {
    store.dispatch(toggleStreamTree());
    expect(recreateDisplayDefaultsJson(store).stream_label).toBeUndefined();
  });

  it("Zooming into node 'echo' sets display_defaults.label = node_name:echo", () => {
    store.dispatch(updateVisibleTipsAndBranchThicknesses({ root: [6, undefined] }));
    expect(recreateDisplayDefaultsJson(store).label).toEqual('node_name:echo');
  });


})
