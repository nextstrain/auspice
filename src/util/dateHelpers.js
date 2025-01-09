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
  const yearObj = new Date(year, 0, 1);
  if (year<100) yearObj.setFullYear(year);
  const date = new Date(yearObj.getTime() + nDays*24*60*60*1000);
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
 * Convert a YYYY-MM-DD string to a numeric date. This function is meant to
 * behave similarly to TreeTime's `numeric_date` as found in v0.7*. For negative
 * dates (i.e. BCE) we simply return the year (ignoring month / day). Ambiguity
 * is optionally allowed in the form of YYYY-MM-XX or YYYY-XX-XX in which case
 * the midpoint of the implied range is returned. All non compliant inputs
 * return `undefined`.
 * @param {string} calDate in format YYYY-MM-DD
 * @param {boolean} ambiguity
 * @returns {float|undefined} YYYY.F, where F is the fraction of the year passed
 */
export const calendarToNumeric = (calDate, ambiguity=false) => {
  if (typeof calDate !== "string") return undefined;
  if (calDate[0]==='-') {
    const d = -parseFloat(calDate.substring(1).split('-')[0]);
    return isNaN(d) ? undefined : d;
  }
  const fields = calDate.split("-");
  if (fields.length !== 3) return undefined;
  const [year, month, day] = fields;
  const [numYear, numMonth, numDay] = fields.map((d) => parseInt(d, 10));
  
  if (calDate.includes("X")) {
    if (!ambiguity) return undefined;
    if (year.includes("X")) return undefined;
    if (month.includes("X")) {
      if (isNaN(numYear) || month!=="XX" || day!=="XX") return undefined;
      return numYear + 0.5;
    }
    /* at this point 'day' includes 'X' */
    if (isNaN(numYear) || isNaN(numMonth) || day!=='XX') return undefined;
    const range = [
      _yearMonthDayToNumeric(numYear, numMonth, 1),
      _yearMonthDayToNumeric(numMonth===12?numYear+1:numYear, numMonth===12?1:numMonth+1, 1)
    ];
    return range[0] + (range[1]-range[0])/2;
  }
  return _yearMonthDayToNumeric(numYear, numMonth, numDay);
};

function _yearMonthDayToNumeric(year,month,day) {
  const oneDayInMs = 86400000; // 1000 * 60 * 60 * 24
  /* Beware: for `Date`, months are 0-indexed, days are 1-indexed */
  /* add on 1/2 day to let time represent noon (12h00) */
  const elapsedDaysInYear = (Date.UTC(year, month-1, day) - Date.UTC(year, 0, 1)) / oneDayInMs + 0.5;
  const fracPart = elapsedDaysInYear / (isLeapYear(year) ? 366 : 365);
  return year + fracPart;
}

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
    case "WEEK": {
      const dayIdx = date.getDay(); // 0 is sunday
      if (dayIdx===1) return dateClone;
      dateClone.setDate(date.getDate() + (8-dayIdx)%7 - 7);
      return dateClone;
    }
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
    case "CENTURY": {
      const year = Math.floor((date.getFullYear())/100)*100;
      const ret = new Date(year, 0, 1, 12);
      ret.setFullYear(year);
      return ret;
    }
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
