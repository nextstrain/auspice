import { scaleTime } from "d3-scale";
import { timeFormat, timeParse } from "d3-time-format";

const dateFormatter = timeFormat("%Y-%m-%d");
const dateParser = timeParse("%Y-%m-%d");
const dateScale = scaleTime()
  .domain([new Date(2000, 0, 0), new Date(2100, 0, 0)])
  .range([2000, 2100]);

export const numericToCalendar = (numDate) => {
  if (numDate<0){
    return Math.round(numDate).toString();
  }
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


/* ------------------------------------------------ TMP ---------------------------------------------- */
/* Augur data taken using TreeTime v0.7 at d4450aac32cfafbb62492554d87e23ee4efa168f */
const augurv7Data = [
  ["1899-07-01", 1899.4972602739726],
  ["2000-01-01", 2000.0013661202186],
  ["2016-03-01", 2016.1653005464482],
  ["2019-01-01", 2019.0013698630137],
  ["2019-03-01", 2019.16301369863],
  ["2019-12-01", 2019.9164383561645],
  ["2100-01-01", 2100.0013698630137]
];
console.log("-------------------");
console.log("Augur -> Treetime v0.7 -> Auspice (match?)");
console.log("-------------------");
augurv7Data.forEach((d) => {
  console.log(`${d[0]} -> ${d[1]} -> ${numericToCalendar(d[1])} (${numericToCalendar(d[1]) === d[0]})`);
});

/* Augur data taken using TreeTime v0.6.4.1 */
const augurv641Data = [
  ["1899-07-01", 1899.498288843258],
  ["2000-01-01", 2000.002737850787],
  ["2016-03-01", 2016.167008898015],
  ["2019-01-01", 2019.002737850787],
  ["2019-03-01", 2019.1642710472279],
  ["2019-12-01", 2019.9171800136892],
  ["2100-01-01", 2100.002737850787]
];
console.log("-------------------");
console.log("Augur -> Treetime v0.6.4.1 -> Auspice (match?)");
console.log("-------------------");
augurv641Data.forEach((d) => {
  console.log(`${d[0]} -> ${d[1]} -> ${numericToCalendar(d[1])} (${numericToCalendar(d[1]) === d[0]})`);
});

console.log("")
console.log("-------------------");
console.log("Calendar dates -> numeric (matches Treetime v0.6.4.1 // 0.7*)");
console.log("-------------------");
augurv7Data.forEach((d, i) => {
  const n = calendarToNumeric(d[0]);
  const isClose = (a, b) => Math.abs(a-b) < 0.000001;
  console.log(`${d[0]} -> ${n} (${isClose(n, augurv641Data[i][1])} // ${isClose(n, d[1])})`);
});

/* -------------------------------------------- END  TMP ---------------------------------------------- */
