import { controlsWidth } from "./util/globals";

//export const headerFont = "aw-conqueror-sans, sans-serif";
export const headerFont = "Quicksand, sans-serif";
export const dataFont = "Lato, sans-serif";
export const lighterGrey = "rgb(200, 200, 200)";
export const darkGrey = "#555";
export const medGrey = "#888";
export const lightGrey = "#CCC";
export const brandColor = "#5DA8A3";

// http://stackoverflow.com/questions/1895476/how-to-style-a-select-dropdown-with-css-only-without-javascript
export const select = {
  background: "transparent",
  fontFamily: dataFont,
  width: controlsWidth,
  fontSize: 16,
  border: "1px solid #ccc",
  height: 34,
  appearance: "none",
  borderRadius: 6,
  color: medGrey
};

export const materialButton = {
  border: "1px solid #CCC",
  backgroundColor: "#FFFFFF",
  margin: 5,
  borderRadius: 6,
  cursor: "pointer",
  padding: "10px 10px 0px 10px",
  fontFamily: dataFont,
  // height: 40,
  // width: 140,
};
