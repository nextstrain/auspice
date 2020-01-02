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

