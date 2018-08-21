export const datasetToText = (query) => {
  let text = "";
  for (let key in query) { // eslint-disable-line
    switch (key) {
      case "c": {
        text += `Colored by ${query.c}. `;
        break;
      }
      case "dmin": {
        text += `Minimum date: ${query.dmin}. `;
        break;
      }
      case "dmax": {
        text += `Maximum date: ${query.dmax}.`;
        break;
      }
      default: {
        break;
      }
    }
  }
  if (!text.length) {
    return "default";
  }
  return text;
};
