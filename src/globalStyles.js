import { controlsWidth } from "./util/globals";

//export const headerFont = "aw-conqueror-sans, sans-serif";
export const titleFont = "Quicksand, sans-serif";
export const headerFont = "Lato, sans-serif";
export const dataFont = "Lato, sans-serif";
export const lighterGrey = "rgb(200, 200, 200)";
export const darkGrey = "#333";
export const medGrey = "#888";
export const lightGrey = "#CCC";
export const brandColor = "#5DA8A3";

// http://stackoverflow.com/questions/1895476/how-to-style-a-select-dropdown-with-css-only-without-javascript
export const select = {
  background: "transparent",
  fontFamily: dataFont,
  width: controlsWidth,
  fontSize: 14,
  border: "1px solid #ccc",
  height: 34,
  appearance: "none",
  borderRadius: 6,
  color: darkGrey,
  fontWeight: 400
};

export const materialButton = {
  border: "0px",
  backgroundColor: "#FFFFFF",
  margin: 5,
  borderRadius: 2,
  cursor: "pointer",
  padding: 5,
  fontFamily: dataFont,
  color: brandColor,
  fontWeight: 400,
  textTransform: "uppercase",
  fontSize: 14,
  verticalAlign: "top"
};

export const materialButtonSelected = {
  border: "0px",
  backgroundColor: brandColor,
  margin: 5,
  borderRadius: 2,
  cursor: "pointer",
  padding: 5,
  fontFamily: dataFont,
  color: "#FFF",
  fontWeight: 400,
  textTransform: "uppercase",
  fontSize: 14,
  verticalAlign: "top"  
};
