import moment from "moment";

export const floatDateToMoment = function (num_date) {
  const years = num_date.toString().split(".")[0];
  let days = Math.floor(num_date % 1 * 365.25).toString();
  if (days === "0") {days = 1;}
  return moment("".concat(years, "-", days), "Y-DDD");
};

export const numericToCalendar = function (dateFormat, dateScale, numDate) {
  return(dateFormat(dateScale.invert(numDate)));
};

export const calendarToNumeric = function (dateFormat, dateScale, calDate) {
  return(dateScale(dateFormat.parse(calDate)));
};
