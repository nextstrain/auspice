/**
 * @jest-environment jsdom
 */
/* NOTE: We use the jsdom environment since `createStateFromQueryOrJSONs` relies on `window` */

import { createStateFromQueryOrJSONs } from "../src/actions/recomputeReduxState";
import { treeStateToJson, metadataStateToJson } from "../src/util/treeJsonProcessing";
import genericJson from './data/generic.json';
import complexAnnotationJson from './data/test_complex-genome-annotation.json';

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function dispatch() { /* no-op */ }

function ingestJson(json) {
  return createStateFromQueryOrJSONs({ json: clone(json), query: {}, dispatch });
}

function reconstructMeta(state) {
  return metadataStateToJson(state.metadata, state.entropy?.genomeMap);
}

/* ------------------------------------------------------------------ */
/*  generic.json round-trips                                          */
/* ------------------------------------------------------------------ */

describe("generic.json round-trip", () => {
  let state, reconstructed;
  beforeAll(() => {
    state = ingestJson(genericJson);
    reconstructed = reconstructMeta(state);
  });

  it("scalar meta fields round-trip", () => {
    const original = genericJson.meta;
    expect(reconstructed.title).toEqual(original.title);
    expect(reconstructed.updated).toEqual(original.updated);
    expect(reconstructed.description).toEqual(original.description);
    expect(reconstructed.warning).toEqual(original.warning);
    expect(reconstructed.maintainers).toEqual(original.maintainers);
    expect(reconstructed.build_url).toEqual(original.build_url);
    expect(reconstructed.build_avatar).toEqual(original.build_avatar);
    expect(reconstructed.data_provenance).toEqual(original.data_provenance);
    expect(reconstructed.stream_labels).toEqual(original.stream_labels);
  });

  it("filters round-trip", () => {
    expect(reconstructed.filters).toEqual(genericJson.meta.filters);
  });

  it("panels round-trip", () => {
    expect(reconstructed.panels).toEqual(genericJson.meta.panels);
  });

  it("geo_resolutions round-trip", () => {
    expect(reconstructed.geo_resolutions).toEqual(genericJson.meta.geo_resolutions);
  });

  it("colorings round-trip (excluding synthetic gt)", () => {
    const originalColorings = genericJson.meta.colorings;
    expect(reconstructed.colorings).toEqual(originalColorings);
  });

  it("display_defaults round-trip", () => {
    expect(reconstructed.display_defaults).toEqual(genericJson.meta.display_defaults);
  });

  it("genome_annotations round-trip (simple nuc-only)", () => {
    expect(reconstructed.genome_annotations).toEqual(genericJson.meta.genome_annotations);
  });

  it("tree round-trip", () => {
    const reconstructedTree = treeStateToJson(state.tree);
    expect(reconstructedTree).toEqual(genericJson.tree);
  });
});

/* ------------------------------------------------------------------ */
/*  complex genome annotation round-trip                              */
/* ------------------------------------------------------------------ */

describe("complex genome annotation round-trip", () => {
  let state, reconstructed;
  beforeAll(() => {
    state = ingestJson(complexAnnotationJson);
    reconstructed = reconstructMeta(state);
  });

  it("nuc annotation round-trips", () => {
    expect(reconstructed.genome_annotations.nuc).toEqual(
      complexAnnotationJson.meta.genome_annotations.nuc
    );
  });

  it("simple positive-strand CDS round-trips", () => {
    const orig = complexAnnotationJson.meta.genome_annotations["pos-single"];
    const rec = reconstructed.genome_annotations["pos-single"];
    expect(rec.start).toEqual(orig.start);
    expect(rec.end).toEqual(orig.end);
    expect(rec.strand).toEqual(orig.strand);
    expect(rec.display_name).toEqual(orig.display_name);
  });

  it("multi-segment positive-strand CDS round-trips", () => {
    const orig = complexAnnotationJson.meta.genome_annotations["pos-multi"];
    const rec = reconstructed.genome_annotations["pos-multi"];
    expect(rec.segments).toEqual(orig.segments);
    expect(rec.strand).toEqual(orig.strand);
    expect(rec.display_name).toEqual(orig.display_name);
  });

  it("wrapping positive-strand CDS round-trips", () => {
    const orig = complexAnnotationJson.meta.genome_annotations["pos-wrapping"];
    const rec = reconstructed.genome_annotations["pos-wrapping"];
    expect(rec.start).toEqual(orig.start);
    expect(rec.end).toEqual(orig.end);
    expect(rec.strand).toEqual(orig.strand);
    expect(rec.display_name).toEqual(orig.display_name);
  });

  it("simple negative-strand CDS round-trips", () => {
    const orig = complexAnnotationJson.meta.genome_annotations["neg-single"];
    const rec = reconstructed.genome_annotations["neg-single"];
    expect(rec.start).toEqual(orig.start);
    expect(rec.end).toEqual(orig.end);
    expect(rec.strand).toEqual(orig.strand);
    expect(rec.display_name).toEqual(orig.display_name);
  });

  it("multi-segment negative-strand CDS round-trips", () => {
    const orig = complexAnnotationJson.meta.genome_annotations["neg-multi"];
    const rec = reconstructed.genome_annotations["neg-multi"];
    expect(rec.segments).toEqual(orig.segments);
    expect(rec.strand).toEqual(orig.strand);
    expect(rec.display_name).toEqual(orig.display_name);
  });

  it("wrapping negative-strand CDS round-trips", () => {
    const orig = complexAnnotationJson.meta.genome_annotations["neg-wrapping"];
    const rec = reconstructed.genome_annotations["neg-wrapping"];
    expect(rec.start).toEqual(orig.start);
    expect(rec.end).toEqual(orig.end);
    expect(rec.strand).toEqual(orig.strand);
    expect(rec.display_name).toEqual(orig.display_name);
  });

  it("tree round-trip", () => {
    const reconstructedTree = treeStateToJson(state.tree);
    expect(reconstructedTree).toEqual(complexAnnotationJson.tree);
  });
});

/* ------------------------------------------------------------------ */
/*  Full round-trip: re-ingest reconstructed JSON                     */
/* ------------------------------------------------------------------ */

describe("full round-trip re-ingestion", () => {
  it("re-ingesting reconstructed generic.json produces equivalent state", () => {
    const state1 = ingestJson(genericJson);
    const meta1 = reconstructMeta(state1);
    const tree1 = treeStateToJson(state1.tree);
    const reconstructedJson = { version: "v2", meta: meta1, tree: tree1 };

    const state2 = ingestJson(reconstructedJson);

    /* Same number of tree nodes */
    expect(state2.tree.nodes.length).toEqual(state1.tree.nodes.length);
    /* Same coloring keys */
    expect(Object.keys(state2.metadata.colorings).sort())
      .toEqual(Object.keys(state1.metadata.colorings).sort());
    /* Same metadata scalar fields */
    expect(state2.metadata.title).toEqual(state1.metadata.title);
    expect(state2.metadata.updated).toEqual(state1.metadata.updated);
    expect(state2.metadata.panels).toEqual(state1.metadata.panels);
    expect(state2.metadata.filters).toEqual(state1.metadata.filters);
  });

  it("re-ingesting reconstructed complex annotation JSON produces equivalent state", () => {
    const state1 = ingestJson(complexAnnotationJson);
    const meta1 = reconstructMeta(state1);
    const tree1 = treeStateToJson(state1.tree);
    const reconstructedJson = { version: "v2", meta: meta1, tree: tree1 };

    const state2 = ingestJson(reconstructedJson);

    expect(state2.tree.nodes.length).toEqual(state1.tree.nodes.length);
    expect(Object.keys(state2.metadata.colorings).sort())
      .toEqual(Object.keys(state1.metadata.colorings).sort());
    expect(state2.metadata.title).toEqual(state1.metadata.title);
    expect(state2.metadata.panels).toEqual(state1.metadata.panels);
  });
});
