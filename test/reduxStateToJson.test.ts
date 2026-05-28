/**
 * @jest-environment jsdom
 */
/* NOTE: We use the jsdom environment since `createStateFromQueryOrJSONs` relies on `window` */

/* Allow assertions here to simplify things - if we get them wrong the tests will flag them up */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import rootReducer from "../src/reducers";
import { getDefaultControlsState } from "../src/reducers/controls";
import { createStateFromQueryOrJSONs } from "../src/actions/recomputeReduxState";
import { CLEAN_START } from "../src/actions/types";
import { createDatasetJson } from "../src/util/constructDatasetJson";
import type { RootState } from "../src/store";
import genericJson from './data/generic.json';
import complexAnnotationJson from './data/test_complex-genome-annotation.json';

/* P.S. provision these (non-git-committed) files via `npm run fetch-test-data` */
// @ts-ignore This will fail type-check if the JSONs haven't been fetched
import ebov2013 from './fetched-jsons/ebola-ebov-2013.json';
// @ts-ignore This will fail type-check if the JSONs haven't been fetched
import ebovAllOutbreaks from './fetched-jsons/ebola-all-outbreaks.json';


/* Modify global types to specify our custom match functions */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toMatchAnnotation(expected: unknown): R;
      toEqualDisplayDefault(expected: unknown): R;
    }
  }
}

function clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

/**
 * Create a redux store and load data into it via CLEAN_START, mirroring the SPA.
 */
function createTestStore(json: unknown): EnhancedStore<RootState> {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  });
  const cleanStartState = createStateFromQueryOrJSONs({
    json: clone(json) as any, query: {}, dispatch: store.dispatch,
  });
  store.dispatch({ type: CLEAN_START, ...cleanStartState });
  return store as EnhancedStore<RootState>;
}

const datasets: [string, Record<string, unknown>][] = [
  ["generic.json", genericJson as Record<string, unknown>],
  ["complexAnnotationJson", complexAnnotationJson as Record<string, unknown>],
  ["West African Ebola Outbreak (EBOV-2013)", ebov2013 as Record<string, unknown>],
  ["All EBOV outbreaks", ebovAllOutbreaks as Record<string, unknown>],
];

describe.each(datasets)("\n\n%s round-trip", (_name, originalJson) => {
  let store: EnhancedStore<RootState>;
  let reconstructedJson: ReturnType<typeof createDatasetJson>;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    store = createTestStore(originalJson);
    reconstructedJson = createDatasetJson(store.getState);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("JSON top-level keys are the same (tree, meta etc)", () => {
    const originalKeys = new Set(Object.keys(originalJson));
    expect(originalKeys).toEqual(new Set(Object.keys(reconstructedJson)));
    expect(originalKeys).toContain('tree');
    expect(originalKeys).toContain('meta');
  });

  describe("JSON.meta", () => {
    const meta = originalJson.meta as Record<string, unknown>;

    const NON_ROUND_TRIPPED_KEYS = [
      'extensions', // data structures aren't stored in redux state and thus aren't possible to round-trip (We could special case Nextclade in the future)
    ];

    it("JSON.meta keys are the same", () => {
      const originalKeys = new Set(
        [...Object.keys(originalJson.meta as Record<string, unknown>)].filter((k) => !NON_ROUND_TRIPPED_KEYS.includes(k))
      );
      const reconstructedKeys = new Set(Object.keys(reconstructedJson.meta || {}));
      expect(originalKeys).toEqual(reconstructedKeys);
    });

    /**
     * Partition the meta properties on the (original) JSON according to how we test them
     */
    const scalarKeys: (keyof typeof meta)[] = [];
    const compareByEqualityKeys: (keyof typeof meta)[] = [];
    for (const key of Object.keys(meta)) {
      if (NON_ROUND_TRIPPED_KEYS.includes(key)) continue;
      if (['title', 'updated', 'version', 'warning', 'description', 'build_url', 'build_avatar'].includes(key)) {
        scalarKeys.push(key);
      } else if (['display_defaults', 'genome_annotations', 'colorings'].includes(key)) {
        // no-op: handled as special-cases below
      } else {
        compareByEqualityKeys.push(key);
      }
    }

    it("JSON.meta.X = <scalar> values are the same", () => {
      for (const key of scalarKeys) {
        if (Object.hasOwn(meta, key)) {
          expect(meta[key]).toEqual(reconstructedJson.meta[key])
        }
      }
    });

    /* Directly compare most of the (non-scalar) .meta data structures using individual `it` calls to make failures easier to understand */
    const originalMeta = originalJson.meta as Record<string, unknown>;
    for (const key of compareByEqualityKeys) {
      it(`JSON.meta.${key} values are the same`, () => {
        expect(originalMeta[key]).toEqual(reconstructedJson.meta[key])
      });
    }

    const display_defauts = originalMeta.display_defaults as Record<string, unknown>;
    if (display_defauts) {
      for (const key of Object.keys(display_defauts)) {
        it(`JSON.meta.display_defaults.${key} values are the same`, () => {
          expect(display_defauts[key]).toEqualDisplayDefault([key, reconstructedJson.meta.display_defaults[key]])
        });
      }
    }

    it(`JSON.meta.colorings values are the same`, () => compareColorings(originalMeta.colorings, reconstructedJson.meta.colorings));

    if (originalMeta.genome_annotations as Record<string, unknown>) {
      it(`JSON.meta.genome_annotations values are the same`, () => {
        expect(originalMeta.genome_annotations).toMatchAnnotation(reconstructedJson.meta.genome_annotations)
      });
    }

    it("JSON.root_sequence structures are the same (if applicable)", () => {
      if (!originalJson.root_sequence) return;
      expect(originalJson.root_sequence).toEqual(reconstructedJson.root_sequence);
    });
  });

  describe("JSON.tree", () => {
    it("tree topology (structure and node names) is the same", () => {
      type SimpleTreeNode = { name?: string; children?: SimpleTreeNode[] };
      const queue: [SimpleTreeNode, SimpleTreeNode, string][] = [
        [originalJson.tree as SimpleTreeNode, reconstructedJson.tree as SimpleTreeNode, "root"],
      ];
      while (queue.length > 0) {
        const [a, b, path] = queue.pop()!;
        expect(a.name).toEqual(b.name);
        const aChildren = a.children ?? [];
        const bChildren = b.children ?? [];
        expect(aChildren.length).toEqual(bChildren.length);
        for (let i = 0; i < aChildren.length; i++) {
          queue.push([aChildren[i], bChildren[i], `${path}->${aChildren[i].name}`]);
        }
      }
    });

    it("per-node data (node_attrs, branch_attrs) is the same", () => {
      type TreeNode = { name?: string; children?: TreeNode[]; node_attrs?: unknown; branch_attrs?: unknown };
      type NodeMap = Map<string, { node_attrs?: unknown; branch_attrs?: unknown }>
      /** Flatten tree structure to a Map of node name -> node data */
      const collect = (node: TreeNode, map: NodeMap): NodeMap => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { children: _, name, ...rest } = node;
        expect(map).not.toContain(name);
        map.set(name!, rest);
        for (const child of node.children ?? []) {
          collect(child, map);
        }
        return map;
      };
      const originalNodes = collect(originalJson.tree as TreeNode, new Map());
      const reconstructedNodes = collect(reconstructedJson.tree as TreeNode, new Map());

      expect(originalNodes.size).toEqual(reconstructedNodes.size);
      for (const [name, originalData] of originalNodes) {
        expect(reconstructedNodes.has(name)).toBe(true);
        expect(originalData).toEqual(reconstructedNodes.get(name)!);
      }
    });
  });
});

function compareColorings(original: any, reconstructed: any):void {
  if (original === undefined && reconstructed === undefined) return;

  if (original === undefined && reconstructed) {
    throw new Error(`No coloring data in original JSON but coloring in reconstructed JSON:\n${JSON.stringify(reconstructed)}`);
  }
  if (original && reconstructed === undefined ) {
    throw new Error(`Coloring data in original JSON but no coloring data in reconstructed JSON. Original was:\n${JSON.stringify(original)}`);
  }

  // genotype is automatically injected by Auspice at load-time (if supported)
  const og = original.filter((el) => el.key !== 'gt');
  expect(og.map((el) => el.key)).toEqual(reconstructed.map((el) => el.key));
  expect(og).toEqual(reconstructed);
}

expect.extend({
  toMatchAnnotation(received, expected) {
    const { gene: gene_a, strain: strain_a, color: color_a, display_name: display_name_a, description: description_a } = received;
    const { gene: gene_b, strain: strain_b, color: color_b, display_name: display_name_b, description: description_b } = expected;
    const pass = (
      gene_a === gene_b &&
      strain_a === strain_b &&
      display_name_a === display_name_b &&
      description_a === description_b &&
      // only compare colors if provided in the original JSON, as the exported JSON will contain
      // dynamically-generated colors if they weren't provided
      (color_a === undefined || color_a !== color_b)
    );
    return {
      pass,
      message: (): string => `Annotations blocks differed (using custom comparison)`
    };
  },
});

expect.extend({
  // received: original JSON, expected: reconstructed JSON
  toEqualDisplayDefault(received, [key, expected]) {
    if (received === expected || JSON.stringify(received) === JSON.stringify(expected)) {
      return { pass: true, message: (): string => '' }
    }

    // If the originally specified default matched Auspice's starting defaults,
    // then the JSON behaves the same way without the default being present. Thus we recreate
    // a JSON without it.
    if (received && expected === undefined) {
      const defaultControls = getDefaultControlsState();
      if (
        (key === 'distance_measure' && defaultControls.distanceMeasure === received) ||
        (key === 'layout' && defaultControls.layout === received) ||
        (key === 'geo_resolution' && defaultControls.geoResolution === received) ||
        (key === 'color_by' && defaultControls.colorBy === received) ||
        (key === 'geo_resolution' && defaultControls.geoResolution === received) ||
        (key === 'branch_label' && defaultControls.selectedBranchLabel === received) ||
        (key === 'tip_label' && defaultControls.tipLabelKey === received) ||
        (key === 'transmission_lines' && defaultControls.showTransmissionLines === received) ||
        (key === 'language' && received==='en') // hardcoded default in Auspice code
      ) {
        return { pass: true, message: (): string => '' }
      }
    }

    return {
      pass: false,
      message: (): string => "Display defaults did not agree (after comparison with Auspice's defaults)." +
        `Original JSON: ${ received }, reconstructed JSON: ${ expected }`
    }
  },
});
