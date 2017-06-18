import moment from "moment";

export const floatDateToMoment = function (num_date) {
  const years = num_date.toString().split(".")[0];
  let days = Math.floor(num_date % 1 * 365.25).toString();
  if (days === "0") {days = 1;}
  return moment("".concat(years, "-", days), "Y-DDD");
};
