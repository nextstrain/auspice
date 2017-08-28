import { reallySmallNumber, reallyBigNumber } from "./globals";

const createLegendMatchBound = (colorScale) => {
  const lower_bound = {};
  const upper_bound = {};
  lower_bound[colorScale.domain()[0]] = reallySmallNumber;
  upper_bound[colorScale.domain()[0]] = colorScale.domain()[0];

  for (let i = 1; i < colorScale.domain().length; i++) {
    lower_bound[colorScale.domain()[i]] = colorScale.domain()[i - 1];
    upper_bound[colorScale.domain()[i]] = colorScale.domain()[i];
  }

  upper_bound[colorScale.domain()[colorScale.domain().length - 1]] = reallyBigNumber;

  return {
    lower_bound,
    upper_bound
  };
};

export default createLegendMatchBound;
