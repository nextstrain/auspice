import { rgb } from "d3-color";
import { mean } from "d3-array";

/**
* Takes an array of color hex strings.
* Returns a color hex string representing the average of the array.
* @param {Array} colors - array of hex strings
*/
export const averageColors = (hexColors) => {
  const n = hexColors.length;
  const colors = hexColors.map((hex) => rgb(hex));
  const reds = colors.map((col) => col.r);
  const greens = colors.map((col) => col.g);
  const blues = colors.map((col) => col.b);
  const avg = rgb(mean(reds), mean(greens), mean(blues));
  return avg.toString();
}
