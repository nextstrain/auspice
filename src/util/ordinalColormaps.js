/*********************************
**********************************
**********************************
**********************************
** Ordinal colormaps
**********************************
**********************************
**********************************
*********************************/

const fluRegionsColormap = [
  ["Africa", "#5097BA"],
  ["SouthAmerica", "#60AA9E"],
  ["WestAsia", "#75B681"],
  ["Oceania", "#8EBC66"],
  ["Europe", "#AABD52"],
  ["JapanKorea", "#C4B945"],
  ["NorthAmerica", "#D9AD3D"],
  ["SoutheastAsia", "#E59637"],
  ["SouthAsia", "#E67030"],
  ["China", "#DF4327"]
  ];

const zikaRegionsColormap = [
  ["french_polynesia", "#3E58CF"],
  ["american_samoa", "#426FCE"],
  ["china", "#4784C8"],
  ["brazil", "#72B485"],
  ["colombia", "#81BA72"],
  ["venezuela", "#92BC63"],
  ["suriname", "#A4BE56"],
  ["guatemala", "#B6BD4C"],
  ["haiti", "#C6B944"],
  ["martinique", "#D4B13F"],
  ["puerto_rico", "#DEA63B"],
  ["mexico", "#E59637"],
  ["dominican_republic", "#E67E33"],
  ["panama", "#E4632E"]
];

/* a function so that we can pipe virus through from react router */
export const ordinalColorMapFor = (virus) => {
  let colormap;
  if (virus === "flu") {
    colormap = fluRegionsColormap;
  } else if (virus === "zika") {
    colormap = zikaRegionsColormap;
  }
  return colormap;
};
