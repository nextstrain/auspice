/**
 * Convert a numeric date to a calendar date (which is nicer to display)
 * This is (for CE dates) meant to be used as the inverse ofthe TreeTime
 * function `numeric_date` which places the numeric date at noon (12h00),
 * i.e. Jan 1 is 0.5/365 of a year (if the year is not a leap year).
 * @param {numeric} numDate Numeric date
 * @returns {string} date in YYYY-MM-DD format for CE dates, YYYY for BCE dates
 */
export const numericToCalendar = (numDate) => {
  /* for BCE dates, return the (rounded) year */
  if (numDate<0) {
    return Math.round(numDate).toString();
  }
  /* for CE dates, return string in YYYY-MM-DD format */
  /* Beware: for `Date`, months are 0-indexed, days are 1-indexed */
  const fracPart = numDate%1;
  const year = parseInt(numDate, 10);
  const nDaysInYear = isLeapYear(year) ? 366 : 365;
  const nDays = fracPart * nDaysInYear;
  const date = new Date((new Date(year, 0, 1)).getTime() + nDays*24*60*60*1000);
  return dateToString(date);
};

/**
 * Convert a calendar date to a numeric one.
 * This function is meant to behave similarly to TreeTime's `numeric_date`
 * as found in v0.7*. Note that for negative dates, i.e. BCE, no fraction
 * in the year will be returned.
 * @param {string} calDate in format YYYY-MM-DD
 * @returns {float} YYYY.F, where F is the fraction of the year passed
 */
export const calendarToNumeric = (calDate) => {
  if (calDate[0]==='-') {
    const pieces = calDate.substring(1).split('-');
    return -parseFloat(pieces[0]);
  }
  /* Beware: for `Date`, months are 0-indexed, days are 1-indexed */
  const [year, month, day] = calDate.split("-").map((n) => parseInt(n, 10));
  const oneDayInMs = 86400000; // 1000 * 60 * 60 * 24
  /* add on 1/2 day to let time represent noon (12h00) */
  const elapsedDaysInYear = (Date.UTC(year, month-1, day) - Date.UTC(year, 0, 1)) / oneDayInMs + 0.5;
  const fracPart = elapsedDaysInYear / (isLeapYear(year) ? 366 : 365);
  return year + fracPart;
};

export const currentCalDate = () => dateToString(new Date());

export const currentNumDate = () => calendarToNumeric(currentCalDate());

function dateToString(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isLeapYear(year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

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
