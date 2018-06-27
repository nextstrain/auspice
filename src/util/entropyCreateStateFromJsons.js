import { genotypeColors } from "./globals";

const getAnnotations = (jsonData) => {
  const annotations = [];
  let aaCount = 0;
  for (const prot of Object.keys(jsonData)) {
    if (prot !== "nuc") {
      aaCount++;
      annotations.push({
        prot: prot,
        start: jsonData[prot].start,
        end: jsonData[prot].end,
        readingFrame: 1, // +tmpProt['pos'][0]%3,
        fill: genotypeColors[aaCount % 10]
      });
    }
  }
  return annotations;
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
  if (metaJSON.panels.includes("entropy") && metaJSON.annotations) {
    const annotations = getAnnotations(metaJSON.annotations);
    return {
      showCounts: false,
      loaded: true,
      annotations,
      geneMap: processAnnotations(annotations)
    };
  }
  return {
    showCounts: false,
    loaded: false,
    geneMap: {}
  };
};
