import { scaleTime } from "d3-scale";
import { timeFormat, timeParse } from "d3-time-format";

const dateFormatter = timeFormat("%Y-%m-%d");
const dateParser = timeParse("%Y-%m-%d");
const dateScale = scaleTime()
  .domain([new Date(2000, 0, 0), new Date(2100, 0, 0)])
  .range([2000, 2100]);

export const numericToCalendar = (numDate) => {
  const d3Date = dateScale.invert(numDate);
  const calDate = dateFormatter(d3Date);
  return calDate;
};

export const calendarToNumeric = (calDate) => {
  if (calDate[0]==='-'){
    const pieces = calDate.substring(1).split('-');
    return -parseFloat(pieces[0]);
  }else{
    const d3Date = dateParser(calDate);
    const numDate = dateScale(d3Date);
    return numDate;
  }
};

export const currentNumDate = () => {
  const now = new Date();
  return dateScale(now);
};

export const currentCalDate = () => {
  const now = new Date();
  return dateFormatter(now);
};
