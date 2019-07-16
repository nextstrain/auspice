import { genotypeColors, nucleotide_gene } from "./globals";

const getAnnotations = (jsonData) => {
  const annotations = [];
  const nuc = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    if (prot !== nucleotide_gene) {
      aaCount++;
      annotations.push({
        prot: prot,
        start: jsonData[prot].start,
        end: jsonData[prot].end,
        readingFrame: jsonData[prot].strand,
        fill: genotypeColors[aaCount % 10]
      });
    } else {
      nuc.push({
        start: jsonData[prot].start,
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

export const entropyCreateStateFromJsons = (metaJSON) => {
  if (metaJSON.annotations && metaJSON.annotations.nuc) {
    // const annotations = getAnnotations(metaJSON.annotations);
    const ant = getAnnotations(metaJSON.annotations);
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
  const annotations = [];
  return {
    showCounts: false,
    loaded: false,
    annotations,
    geneMap: {}
  };
};
