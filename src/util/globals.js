import d3 from "d3";

// datasets json: object of list (to ensure order) of list (to be flexible)
// until terminated by an empty list indicating that no further datasets
// resolution are made
export const datasets={
  'virus':{
    'flu':{
      'lineages':{
        'h3n2':     {'duration':{'3y':{}, '6y':{}, '12y':{}, 'default':'3y'}},
        'h1n1pdm':  {'duration':{'3y':{}, '6y':{}, '12y':{}, 'default':'3y'}},
        'Vic':      {'duration':{'3y':{}, '6y':{}, '12y':{}, 'default':'3y'}},
        'Yam':      {'duration':{'3y':{}, '6y':{}, '12y':{}, 'default':'3y'}},
        'default':'h3n2',
        }
      },
    'zika':{},
    'ebola':{},
    'default':'flu'
  }
}

export const colorOptions = {
    "country":{"key":"country", "legendTitle":"Country", "menuItem":"country", "type":"discrete"},
    "region":{"key":"region", "legendTitle":"Region", "menuItem":"region", "type":"discrete"},
    "num_date":{"key":"num_date", "legendTitle":"Sampling date", "menuItem":"date", "type":"continuous"},
    "ep":{"key":"ep", "legendTitle":"Epitope Mutations", "menuItem":"epitope mutations", "type":"continuous"},
    "ne":{"key":"ne", "legendTitle":"Non-epitope Mutations", "menuItem":"nonepitope mutations", "type":"continuous"},
    "rb":{"key":"rb", "legendTitle":"Receptor Binding Mutations", "menuItem":"RBS mutations", "type":"continuous"},
    "gt":{"key":"genotype", "legendTitle":"Genotype", "menuItem":"genotype", "type":"discrete"}
  }


/* static for now, then hand rolled version of https://github.com/digidem/react-dimensions */
export const width = 800;
export const margin = 60;
export const defaultColorBy = "country";
export const defaultDateSliderFraction = 0.3;
export const defaultDateRange = 6;
export const date_select = true;
export const file_prefix = "Zika_";
export const branchLabels = false;
export const restrictTo = {"region": "all"};
export const time_window = 3.0;
export const fullDataTimeWindow = 1.5;
export const time_ticks = [2013.0, 2013.5, 2014.0, 2014.5, 2015.0, 2015.5, 2016.0];
export const dfreq_dn = 2;
export const reallySmallNumber = -100000000;
export const reallyBigNumber = 10000000;
export const LBItime_window = 0.5;
export const LBItau = 0.0005;
export const mutType = "nuc";
export const default_gene = "nuc";
export const plot_frequencies = false;
export const genericDomain = [ 0, 0.111, 0.222, 0.333, 0.444, 0.555, 0.666, 0.777, 0.888, 1.0 ];
export const epiColorDomain = genericDomain;
export const nonEpiColorDomain = genericDomain;
export const rbsColorDomain = genericDomain;
export const dateColorDomain = genericDomain;
export const legendRectSize = 15;
export const legendSpacing = 4;
export const nonTipNodeRadius = 0;
export const tipRadius = 4;
export const tipRadiusOnLegendMatchMultiplier = 1.7;
export const defaultDistanceMeasures = ["num_date", "div"];
export const fastTransitionDuration = 300; // in milliseconds
export const mediumTransitionDuration = 600; // in milliseconds
export const slowTransitionDuration = 1200; // in milliseconds
export const HIColorDomain = genericDomain.map((d) => {
  return Math.round(100 * (d * 3.6)) / 100;
});
export const dfreqColorDomain = genericDomain.map((d) => {
  return Math.round(100 * (0.2 + d * 1.8)) / 100;
});
export const fitnessColorDomain = genericDomain.map((d) => {
  return Math.round(100 * ((d - 0.5) * 16.0)) / 100;
});
export const dHIScale = d3.scale.linear()
  .domain([0, 1])
  .range([2.0, 4.5]);

export const freqScale = d3.scale.sqrt()
  .domain([0, 1])
  .range([1, 10]);

export const distanceScale = d3.scale.sqrt()
  .domain([3, 20])
  .range([9, 3])
  .clamp([true]);

export const colors = [
  [],
  ["#8EBC66"],
  ["#4D92BF", "#E4662E"],
  ["#4B8FC1", "#AABD52", "#E3612D"],
  ["#4A8BC3", "#82BA72", "#CFB541", "#E25B2C"],
  ["#4988C5", "#6EB389", "#AABD52", "#DEA73C", "#E2562B"],
  ["#4785C7", "#64AD99", "#90BC65", "#C3BA46", "#E39A39", "#E1512A"],
  ["#4682C9", "#5CA7A4", "#7FB975", "#AABD52", "#D2B340", "#E68F36", "#E04C29"],
  ["#457FCB", "#57A1AD", "#73B584", "#96BD5F", "#BDBB49", "#DBAC3D", "#E68334", "#DF4628"],
  ["#447BCD", "#539CB4", "#6AB090", "#88BB6C", "#AABD52", "#CBB842", "#E0A23A", "#E67A32", "#DF4127"],
  ["#4377CD", "#5097BA", "#63AC9A", "#7CB879", "#9ABE5C", "#B9BC4A", "#D4B13F", "#E49938", "#E67030", "#DE3C26"],
  ["#4273CE", "#4D93BE", "#5DA8A3", "#73B584", "#8DBC68", "#AABD52", "#C6B945", "#DBAC3D", "#E69036", "#E4672E", "#DD3725"],
  ["#426FCE", "#4B8DC2", "#59A3AA", "#6BB18D", "#82BA71", "#9CBE5B", "#B7BD4B", "#CFB541", "#DFA43B", "#E68735", "#E35E2D", "#DD3124"]
];
export const genotypeColors = [
  "#60AA9E",
  "#D9AD3D",
  "#5097BA",
  "#E67030",
  "#8EBC66",
  "#E59637",
  "#AABD52",
  "#DF4327",
  "#C4B945",
  "#75B681"
];
export const regions = [
  ['southeast_asia',     '#462EB9'],
  ['oceania',            '#3F4FCC'],
  ['china',              '#4271CE'],
  ['japan_korea',        '#4B8DC2'],
  ['south_america',      '#69B091'],
  ['north_america',      '#E0A33B']
];
export const countries = [
// Asia: "#462EB9", "#403DC5", "#3F4FCC", "#3F60D0", "#4271CE", "#4580CA", "#4B8DC2", "#5199B8", "#58A2AC"
["thailand",           "#462EB9"],
["singapore",          "#403DC5"],
["french_polynesia",   "#3F4FCC"],
["american_samoa",	   "#3F60D0"],
["tonga",	             "#4271CE"],
["china",			         "#4580CA"],
["japan",			         "#4B8DC2"],
// South America: "#60AA9F", "#69B091", "#73B584", "#7DB877", "#89BB6B", "#95BD60", "#A2BE57", "#AFBD4F"
["brazil",  		       "#60AA9F"],
["ecuador",  		       "#7DB877"],
["colombia",  		     "#89BB6B"],
["french_guiana",  	   "#95BD60"],
["suriname",  		     "#A2BE57"],
["venezuela",  		     "#AFBD4F"],
// Central America: "#BBBC49", "#C6B944", "#D0B440", "#D9AD3D", "#E0A33B", "#E49838", "#E68835", "#E67732", "#E4632E", "#E04E2A", "#DE3926"
["panama",             "#BBBC49"],
["honduras",           "#C6B944"],
["guatemala",  		     "#D0B440"],
["mexico",             "#D9AD3D"],
["martinique",  	     "#E0A33B"],
["guadeloupe",         "#E49838"],
["puerto_rico",  	     "#E68835"],
["dominican_republic", "#E67732"],
["haiti",  			       "#E4632E"],
["usa",                "#E04E2A"]
];

//const filterAbbr = [["geo", "geographic location"]];
export const filterAbbrFwd = {"geo":"geographic location", "all":"all"};
export const filterAbbrRev = {"geographic location":"geo", "all":"all"};
