import { getDefaultTreeState } from "../reducers/tree";
import { Mutations, ReduxNode, TreeState } from "../reducers/tree/types";
import { getVaccineFromNode, getTraitFromNode, getDivFromNode } from "./treeMiscHelpers";
import { calcFullTipCounts } from "./treeCountingHelpers";

/**
 * Lightweight type alias for the Chromosome[] structure produced by genomeMap().
 * We avoid importing the actual types from entropyCreateStateFromJsons.ts as they
 * are not exported; this is sufficient for our reconstruction purposes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenomeMap = any[];

const pseudoRandomName = (): string => (Math.random()*1e32).toString(36).slice(0, 6);

/**
 * Adds the following properties to each node:
 * - fullTipCount
 * - hasChildren
 * - arrayIdx
 */
const processNodes = (nodes: ReduxNode[]): {
  /** collection of all `node_attr` keys whose values are Objects */
  nodeAttrKeys: Set<string>

  /** input array (kinda unnecessary) */
  nodes: ReduxNode[]
} => {
  const nodeNamesSeen = new Set<string>();
  const nodeAttrKeys = new Set<string>();
  calcFullTipCounts(nodes[0]); /* recursive. Uses d.children */
  nodes.forEach((d, idx) => {
    d.arrayIdx = idx; /* set an index so that we can access visibility / nodeColors if needed */
    d.hasChildren = typeof d.children !== "undefined";

    /* duplicate or missing names are an error with the dataset, but typically result in
    very hard-to-interpret Auspice errors which we can improve by detecting problems early */
    if (!d.name) {
      d.name = pseudoRandomName();
      console.warn(`Tree node without a name detected. Using the name '${d.name}' and continuing...`);
    }
    if (nodeNamesSeen.has(d.name)) {
      const prev = d.name;
      d.name = `${d.name}_${pseudoRandomName()}`;
      console.warn(`Tree node detected with a duplicate name. Changing '${prev}' to '${d.name}' and continuing...`);
    }
    nodeNamesSeen.add(d.name);

    for (const [attrKey, attrValue] of Object.entries(d.node_attrs || {})) {
      if (typeof attrValue === 'object' && 'value' in attrValue) {
        nodeAttrKeys.add(attrKey)
      }
    }

  });
  return {nodeAttrKeys, nodes};
};

/**
 * Scan the tree for `node.branch_attrs.labels` dictionaries and collect all available
 * (These are the options for the "Branch Labels" sidebar dropdown)
 */
const processBranchLabelsInPlace = (nodes: ReduxNode[]): string[] => {
  const availableBranchLabels = new Set<string>();
  nodes.forEach((n) => {
    if (n.branch_attrs && n.branch_attrs.labels) {
      Object.keys(n.branch_attrs.labels)
        .forEach((labelName) => {
          availableBranchLabels.add(labelName);
          /* cast all branch label values to strings */
          n.branch_attrs.labels[labelName] = String(n.branch_attrs.labels[labelName]);
        });
    }
  });
  return ["none", ...availableBranchLabels];
};


const makeSubtreeRootNode = (
  nodesArray: ReduxNode[],
  subtreeIndicies: number[],
): ReduxNode => {
  const node: ReduxNode = {
    name: "__ROOT",
    node_attrs: {hidden: "always"},
    children: subtreeIndicies.map((idx) => nodesArray[idx])
  };
  node.parent = node;
  // ensure root has minimum observed divergence & date (across subtree roots)
  const observedDivs = node.children.map((n) => getDivFromNode(n)).filter((div) => div!==undefined);
  if (observedDivs.length) node.node_attrs.div = Math.min(...observedDivs);
  const observedTimes = node.children.map((n) => getTraitFromNode(n, "num_date")).filter((num_date) => num_date!==undefined);
  if (observedTimes.length) node.node_attrs.num_date = {value: Math.min(...observedTimes)};
  return node;
};

/**
*  Pre-order tree traversal visits each node using stack.
*  Checks if leaf node based on node.children
*  pushes all children into stack and continues traversal.
*/
const flattenTree = (
  /** deserialized JSON root to begin traversal */
  root: ReduxNode,
): ReduxNode[] => {
  const stack: ReduxNode[] = [];

  /** final array of nodes in order with no dups */
  const array: ReduxNode[] = [];

  stack.push(root);
  while (stack.length !== 0) {
    const node = stack.pop();
    array.push(node);
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        stack.push(node.children[i]);
      }
    }
  }
  return array;
};

/**
*  Add reference to node.parent for each node in tree
*  For root add root.parent = root
*  Pre-order tree traversal visits each node using stack.
*  Checks if leaf node based on node.children
*  pushes all children into stack and continues traversal.
*/
const appendParentsToTree = (
  /** deserialized JSON root to begin traversal */
  root: ReduxNode,
): void => {
  root.parent = root;
  const stack: ReduxNode[] = [];
  stack.push(root);

  while (stack.length !== 0) {
    const node = stack.pop();
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        node.children[i].parent = node;
        stack.push(node.children[i]);
      }
    }
  }
};

/**
 * Currently this is limited in scope, but is intended to parse
 * information on a branch_attr indicating information about minor/
 * major parents (e.g. recombination, subtree position in another tree).
 */
const addParentInfo = (nodes: ReduxNode[]): void => {
  nodes.forEach((n) => {
    n.parentInfo = {
      original: n.parent
    };
  });
};

/**
 * Collects all mutations on the tree
 * @todo   The original remit of this function was for homoplasy detection.
 *         If storing all the mutations becomes an issue, we may be able use an array
 *         of mutations observed more than once.
 */
const collectObservedMutations = (nodesArray: ReduxNode[]): Mutations => {
  const mutations: Mutations = {};
  nodesArray.forEach((n) => {
    if (!n.branch_attrs || !n.branch_attrs.mutations) return;
    Object.entries(n.branch_attrs.mutations).forEach(([gene, muts]) => {
      muts.forEach((mut) => {
        mutations[`${gene}:${mut}`] ? mutations[`${gene}:${mut}`]++ : (mutations[`${gene}:${mut}`] = 1);
      });
    });
  });
  return mutations;
};

/**
 * Inverse of treeJsonToState: reconstructs the nested JSON tree
 * from the Redux tree state, stripping computed properties.
 */
export const treeStateToJson = (tree: TreeState): object | object[] => {
  const root = tree.nodes[0]; // synthetic __ROOT

  const cleanNode = (node: ReduxNode): object => {
    const cleaned: Record<string, unknown> = {};
    if (node.name) cleaned.name = node.name;
    if (node.node_attrs) cleaned.node_attrs = node.node_attrs;
    if (node.branch_attrs) cleaned.branch_attrs = node.branch_attrs;
    if (node.children?.length) {
      cleaned.children = node.children.map(cleanNode);
    }
    return cleaned;
  };

  const trees = root.children.map(cleanNode);
  return trees.length === 1 ? trees[0] : trees;
};

/**
 * Inverse of genomeMap() in entropyCreateStateFromJsons.ts: reconstructs the
 * `genome_annotations` JSON object from the Chromosome[] genomeMap structure.
 */
export const genomeMapToGenomeAnnotations = (genomeMap: GenomeMap): Record<string, unknown> => {
  const chromosome = genomeMap[0];
  if (!chromosome) return {};

  const annotations: Record<string, Record<string, unknown>> = {};

  annotations.nuc = { start: chromosome.range[0], end: chromosome.range[1] };

  for (const gene of chromosome.genes) {
    for (const cds of gene.cds) {
      const annotation: Record<string, unknown> = {};
      annotation.strand = cds.strand;

      if (cds.isWrapping && cds.segments.length === 2) {
        /*
         * Wrapping CDSs were originally a single contiguous CDS whose end
         * position exceeded the genome length. During ingestion, these are
         * split into two segments. We merge them back, but the original
         * single start/end representation used a convention where end >
         * genome length (e.g. start=93, end=110 on a 100nt genome).
         * We reconstruct this, but if the original JSON actually used an
         * explicit two-segment representation for a wrapping CDS, we would
         * not be able to distinguish that case from an auto-split one.
         */
        const genomeLength = chromosome.range[1];
        const positive = cds.strand === '+';
        /* For +ve strand: segment[0] is the 5' portion (higher genome coords),
           segment[1] is the wrapped portion (lower genome coords).
           For -ve strand: segments were reversed during ingestion, so
           segment[0] is at genome start, segment[1] is the 5' end. */
        const seg5prime = positive ? cds.segments[0] : cds.segments[1];
        const segWrapped = positive ? cds.segments[1] : cds.segments[0];
        annotation.start = seg5prime.rangeGenome[0];
        annotation.end = segWrapped.rangeGenome[1] + genomeLength;
      } else if (cds.segments.length === 1) {
        annotation.start = cds.segments[0].rangeGenome[0];
        annotation.end = cds.segments[0].rangeGenome[1];
      } else {
        /*
         * Multi-segment CDSs (spliced/slippage) are stored as an explicit
         * segments array. The original JSON used the same representation,
         * so this is a faithful reconstruction.
         */
        annotation.segments = cds.segments.map((seg) => ({
          start: seg.rangeGenome[0],
          end: seg.rangeGenome[1],
        }));
      }

      /*
       * Colors may not match the original JSON: if the original CDS did not
       * specify a color, one was auto-assigned from a rotating palette during
       * ingestion. We always include the color here since we cannot
       * distinguish auto-assigned from explicitly provided colors.
       */
      if (cds.color) annotation.color = cds.color;

      if (cds.displayName) annotation.display_name = cds.displayName;
      if (cds.description) annotation.description = cds.description;

      /*
       * The `gene` field is only needed when a gene groups multiple CDSs,
       * or when the gene name differs from the CDS name. If gene.name
       * equals cds.name (the common case of 1 gene = 1 CDS), we omit
       * it to match the typical original JSON structure.
       */
      if (gene.name !== cds.name) {
        annotation.gene = gene.name;
      }

      annotations[cds.name] = annotation;
    }
  }

  return annotations;
};

/**
 * Inverse of createMetadataStateFromJSON: reconstructs the `meta` JSON object
 * from the Redux metadata state, reversing key transformations applied during ingestion.
 */
export const metadataStateToJson = (metadata: Record<string, unknown>, genomeMap?: GenomeMap): object => {
  const meta: Record<string, unknown> = {};

  if (metadata.title) meta.title = metadata.title;
  if (metadata.updated) meta.updated = metadata.updated;
  if (metadata.description) meta.description = metadata.description;
  if (metadata.warning) meta.warning = metadata.warning;
  if (metadata.maintainers) meta.maintainers = metadata.maintainers;
  if (metadata.buildUrl) meta.build_url = metadata.buildUrl;
  if (metadata.buildAvatar) meta.build_avatar = metadata.buildAvatar;
  if (metadata.dataProvenance) meta.data_provenance = metadata.dataProvenance;
  if (metadata.filters) meta.filters = metadata.filters;
  if (metadata.panels) meta.panels = metadata.panels;
  if (metadata.streamLabels) meta.stream_labels = metadata.streamLabels;
  if (metadata.geoResolutions) meta.geo_resolutions = metadata.geoResolutions;

  // Reverse colorings: dict keyed by coloring key → array of {key, ...rest}
  if (metadata.colorings) {
    meta.colorings = Object.entries(metadata.colorings as Record<string, object>)
      .filter(([key]) => key !== 'gt') // 'gt' is synthetically added during ingestion
      .map(([key, value]) => ({ key, ...value as object }));
  }

  // Reverse display_defaults: camelCase → snake_case
  if (metadata.displayDefaults) {
    const auspiceKeyToJsonKey: Record<string, string> = {
      colorBy: "color_by",
      geoResolution: "geo_resolution",
      distanceMeasure: "distance_measure",
      selectedBranchLabel: "branch_label",
      tipLabelKey: "tip_label",
      mapTriplicate: "map_triplicate",
      layout: "layout",
      language: "language",
      sidebar: "sidebar",
      panels: "panels",
      streamLabel: "stream_label",
      showTransmissionLines: "transmission_lines",
      label: "label",
    };
    const displayDefaults: Record<string, unknown> = {};
    const dd = metadata.displayDefaults as Record<string, unknown>;
    for (const [auspiceKey, jsonKey] of Object.entries(auspiceKeyToJsonKey)) {
      if (dd[auspiceKey] !== undefined) {
        displayDefaults[jsonKey] = dd[auspiceKey];
      }
    }
    if (Object.keys(displayDefaults).length) meta.display_defaults = displayDefaults;
  }

  if (genomeMap?.length) {
    meta.genome_annotations = genomeMapToGenomeAnnotations(genomeMap);
  }

  return meta;
};

export const treeJsonToState = (treeJSON): TreeState => {
  const trees = Array.isArray(treeJSON) ? treeJSON : [treeJSON];
  const nodesArray: ReduxNode[] = [];
  const subtreeIndicies = [];
  for (const treeRootNode of trees) {
    appendParentsToTree(treeRootNode);
    subtreeIndicies.push(nodesArray.length);
    nodesArray.push(...flattenTree(treeRootNode));
  }
  nodesArray.unshift(makeSubtreeRootNode(nodesArray, subtreeIndicies));
  const {nodeAttrKeys, nodes} = processNodes(nodesArray);
  addParentInfo(nodesArray);
  const vaccines = nodes.filter((d) => {
    const v = getVaccineFromNode(d);
    return (v && (Object.keys(v).length > 1 || Object.keys(v)[0] !== "serum"));
  });
  const availableBranchLabels = processBranchLabelsInPlace(nodesArray);
  const observedMutations = collectObservedMutations(nodesArray);
  return {
    ...getDefaultTreeState(),
    nodes,
    nodeAttrKeys,
    vaccines,
    observedMutations,
    availableBranchLabels,
    loaded: true,
  };
};
