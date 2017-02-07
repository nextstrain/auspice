import d3 from "d3";

/**
* Takes an array of color hex strings.
* Returns a color hex string representing the average of the array.
* @param {Array} colors - array of hex strings
*/
export const averageColors = (hexColors) => {
  const n = hexColors.length;
  const colors = hexColors.map((hex) => d3.rgb(hex));
  const reds = colors.map((col) => col.r);
  const greens = colors.map((col) => col.g);
  const blues = colors.map((col) => col.b);
  const avg = d3.rgb(d3.mean(reds), d3.mean(greens), d3.mean(blues));
  return avg.toString();
}
