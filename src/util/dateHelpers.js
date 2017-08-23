import moment from "moment";

export const floatDateToMoment = function (num_date) {
  const years = num_date.toString().split(".")[0];
  let days = Math.floor(num_date % 1 * 365.25).toString();
  if (days === "0") {days = 1;}
  return moment("".concat(years, "-", days), "Y-DDD");
};

export const numericToCalendar = (dateFormatter, dateScale, numDate) => {
  const d3Date = dateScale.invert(numDate);
  const calDate = dateFormatter(d3Date);
  return calDate;
};

export const calendarToNumeric = (dateParser, dateScale, calDate) => {
  const d3Date = dateParser(calDate);
  const numDate = dateScale(d3Date);
  return numDate;
};
