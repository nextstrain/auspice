import d3 from "d3";
import * as globals from "./globals";

export const epitopeColorScale = d3.scale.linear().clamp([true])
  .domain(globals.epiColorDomain)
  .range(globals.colors[10]);

export const nonepitopeColorScale = d3.scale.linear().clamp([true])
  .domain(globals.nonEpiColorDomain)
  .range(globals.colors[10]);

export const receptorBindingColorScale = d3.scale.linear().clamp([true])
  .domain(globals.rbsColorDomain)
  .range(globals.colors[4]);

export const lbiColorScale = d3.scale.linear()
  .domain([0.0, 0.02, 0.04, 0.07, 0.1, 0.2, 0.4, 0.7, 0.9, 1.0])
  .range(globals.colors[10]);

export const dfreqColorScale = d3.scale.linear()
  .domain(globals.dfreqColorDomain)
  .range(globals.colors[10]);

export const HIColorScale = d3.scale.linear()
  .domain(globals.HIColorDomain)
  .range(globals.colors[10]);

export const cHIColorScale = d3.scale.linear()
  .domain(globals.HIColorDomain)
  .range(globals.colors[10]);

export const dHIColorScale = d3.scale.linear().clamp([true])
  .domain(globals.genericDomain.map((d) => { return 1.5 * d;}))
  .range(globals.colors[10]);

export const regionColorScale = d3.scale.ordinal()
  .domain(globals.regions.map((d) => { return d[0]; }))
  .range(globals.regions.map((d) => { return d[1]; }));

export const countryColorScale = d3.scale.ordinal()
  .domain(globals.countries.map((d) => { return d[0]; }))
  .range(globals.countries.map((d) => { return d[1]; }));

export const dateColorScale = d3.scale.linear().clamp([true])
  .domain(globals.dateColorDomain)
  .range(globals.colors[10]);

export const fitnessColorScale = d3.scale.linear().clamp([true])
  .domain(globals.fitnessColorDomain)
  .range(globals.colors[10]);
