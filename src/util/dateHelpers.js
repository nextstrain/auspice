import { months } from "./globals";

export const dateToString = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Convert a numeric date to a `Date` object
 * This is (for CE dates) meant to be used as the inverse of the TreeTime
 * function `numeric_date` which places the numeric date at noon (12h00),
 * i.e. Jan 1 is 0.5/365 of a year (if the year is not a leap year).
 * @param {numeric} numDate Numeric date
 * @returns {Date} date object
 */
export const numericToDateObject = (numDate) => {
  /* Beware: for `Date`, months are 0-indexed, days are 1-indexed */
  const fracPart = numDate%1;
  const year = parseInt(numDate, 10);
  const nDaysInYear = isLeapYear(year) ? 366 : 365;
  const nDays = fracPart * nDaysInYear;
  const date = new Date((new Date(year, 0, 1)).getTime() + nDays*24*60*60*1000);
  return date;
};

/**
 * Converts a numeric date to a calendar date (which is nicer to display).
 * The inverse of `calendarToNumeric`. See also `numericToDateObject`.
 * @param {numeric} numDate Numeric date
 * @returns {string} date in YYYY-MM-DD format for CE dates, YYYY for BCE dates
 */
export const numericToCalendar = (numDate) => {
  /* for BCE dates, return the (rounded) year */
  if (numDate<0) {
    return Math.round(numDate).toString();
  }
  /* for CE dates, return string in YYYY-MM-DD format */
  const date = numericToDateObject(numDate);
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


function isLeapYear(year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}


/**
 * Get the previous date closest to the provided one by the specified `unit` (e.g. day, week, month...)
 * Weeks are defined to start on a Monday (ISO week)
 * The returned date should represent c. midday on that day
 * NOTE: this function is not simply the inverse of `getNextDate`. We are returning the most recent date
 * (for the given `unit` of time) from the provided `date`. The returned date may be equal to the provided `date`!
 * For instance, the previous WEEK from Monday the 10th is Monday the 10th!, the previous WEEK of Tuesday 11th is Monday 10th.
 * @param {str} unit time unit to advance to (day, week, month, year, century)
 * @param {Date} date JavaScript Date Object
 * @returns {Date} a new Javascript date object. Note that @param `date` isn't modified.
 */
export const getPreviousDate = (unit, date) => {
  const dateClone = new Date(date.getTime());
  const jan1st = date.getDate()===1 && date.getMonth()===0;
  switch (unit) {
    case "DAY":
      return dateClone;
    case "WEEK":
      const dayIdx = date.getDay(); // 0 is sunday
      if (dayIdx===1) return dateClone;
      dateClone.setDate(date.getDate() + (8-dayIdx)%7 - 7);
      return dateClone;
    case "MONTH":
      if (date.getDate()===1) return dateClone; // i.e. 1st of the month
      return new Date(date.getFullYear(), date.getMonth(), 1, 12);
    case "YEAR":
      if (jan1st) return dateClone;
      return new Date(date.getFullYear(), 0, 1, 12);
    case "FIVEYEAR": // fallsthrough
    case "DECADE":
      // decades start at "nice" numbers - i.e. multiples of 5 -- e.g. 2014 -> 2010, 2021 -> 2020
      return new Date(Math.floor((date.getFullYear())/5)*5, 0, 1, 12);
    case "CENTURY":
      return new Date(Math.floor((date.getFullYear())/100)*100, 0, 1, 12);
    default:
      console.error("Unknown unit for `advanceDateTo`:", unit);
      return dateClone;
  }
};

/**
 * Returns a `Date` object one `unit` in the future of the provided `date`
 */
export const getNextDate = (unit, date) => {
  const dateClone = new Date(date.getTime());
  switch (unit) {
    case "DAY":
      dateClone.setDate(date.getDate() + 1);
      break;
    case "WEEK":
      dateClone.setDate(date.getDate() + 7);
      break;
    case "MONTH":
      dateClone.setMonth(date.getMonth() + 1);
      break;
    case "YEAR":
      dateClone.setFullYear(date.getFullYear() + 1);
      break;
    case "FIVEYEAR":
      dateClone.setFullYear(date.getFullYear() + 5);
      break;
    case "DECADE":
      dateClone.setFullYear(date.getFullYear() + 10);
      break;
    case "CENTURY":
      dateClone.setFullYear(date.getFullYear() + 100);
      break;
    default:
      console.error("Unknown unit for `getNextDate`:", unit);
  }
  return dateClone;
};

/**
 * Format the date to be displayed below major gridlines.
 * @param {string} unit CENTURY, DECADE, YEAR etc
 * @param {numeric | string | Date} date can be numeric (2016.123), string (YYYY-MM-DD) or a Date object
 * @returns {string} prettified date for display
 */
export const prettifyDate = (unit, date) => {
  const stringDate = typeof date ==="number" ? numericToCalendar(date) :
    date instanceof Date ? dateToString(date) :
      date;
  let year, month, day;
  if (!stringDate.startsWith("-")) {
    [year, month, day] = stringDate.split("-");
  } else {
    [year, month, day] = stringDate.slice(1).split("-");
    year = `-${year}`;
  }
  switch (unit) {
    case "CENTURY": // falls through
    case "DECADE": // falls through
    case "FIVEYEAR": // falls through
    case "YEAR":
      if (month==="01" && day==="01") return year;
      // falls through if not jan 1st
    case "MONTH":
      if (day==="01") return `${year}-${months[month]}`;
      // falls through if not 1st of month
    default:
      return `${year}-${months[month]}-${day}`;
  }
};
