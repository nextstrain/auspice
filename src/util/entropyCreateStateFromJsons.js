import { genotypeColors, nucleotide_gene } from "./globals";

/* a Note on co-ordinates.
Auspice v1 (and the JSONs it consumed) used 1-based mutations and
0-based, BED-like feature annotations.
Auspice v2 JSONs (which the client will always receive) uses GFF-like
1-based, close ended feature annotations. We adjust the starts here so that
the display remains unchanged, however this should be revisited at a later date.
*/

const getAnnotations = (jsonData) => {
  const annotations = [];
  const nuc = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    if (prot !== nucleotide_gene) {
      aaCount++;
      annotations.push({
        prot: prot,
        start: jsonData[prot].start - 1, // see above
        end: jsonData[prot].end,
        strand: jsonData[prot].strand,
        fill: genotypeColors[aaCount % 10]
      });
    } else {
      nuc.push({
        start: jsonData[prot].start - 1, // see above
        end: jsonData[prot].end
      });
    }
  }
  return [annotations, nuc];
};

const processAnnotations = (annotations) => {
  const m = {}; /* m === geneMap */
  annotations.forEach((d) => {
    m[d.prot] = d;
  });
  const sorted = Object.keys(m).sort((a, b) =>
    m[a].start < m[b].start ? -1 : m[a].start > m[b].start ? 1 : 0
  );
  for (const gene of Object.keys(m)) {
    m[gene].idx = sorted.indexOf(gene);
  }
  return m;
};

export const entropyCreateState = (genomeAnnotations) => {
  if (genomeAnnotations && genomeAnnotations.nuc) {
    const ant = getAnnotations(genomeAnnotations);
    const annotations = ant[0];
    const lengthSequence = ant[1][0].end;
    return {
      showCounts: false,
      loaded: true,
      annotations,
      lengthSequence,
      geneMap: processAnnotations(annotations)
    };
  }
  return {
    showCounts: false,
    loaded: false,
    annotations: [],
    geneMap: {}
  };
};
