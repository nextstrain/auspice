import { numericToCalendar, calendarToNumeric, getPreviousDate, numericToDateObject, dateToString, getNextDate, prettifyDate} from "../src/util/dateHelpers";

/* numeric data computed from augur 10.0.4, treetime 0.7.4 */
const augurDates = {
  "1900-01-01": 1900.0013698630137,
  "1900-12-31": 1900.9986301369863,
  "1904-02-29": 1904.1625683060108,
  "1904-12-31": 1904.9986338797814,
  "2000-01-01": 2000.0013661202186,
  "2000-06-01": 2000.4166666666667,
  "2000-12-31": 2000.9986338797814,
  "2016-11-01": 2016.8346994535518,
  "2020-01-01": 2020.0013661202186,
  "2020-02-29": 2020.1625683060108,
  "2020-06-01": 2020.4166666666667,
  "2020-12-31": 2020.9986338797814
};

/**
 * JSONs encode dates as floats (`num_date`) via augur.
 * This tests the auspice function `numericToCalendar`
 * which converts those to calendar (YYYY-MM-DD) dates.
 */
test("Numeric -> calendar date parsing is the same as in augur", () => {
  Object.entries(augurDates).forEach(([cal, num]) => {
    expect(numericToCalendar(num)).toStrictEqual(cal);
  });
});

/**
 * Test that auspice converts calendar dates to the same
 * (numeric) value as augur. Tiny rounding errors are allowed.
 */
test("Calendar -> numeric date parsing is the same as in augur", () => {
  Object.entries(augurDates).forEach(([cal, num]) => {
    expect(calendarToNumeric(cal)).toBeCloseTo(num);
  });
});

/**
 * Auspice provides `calendarToNumeric` which is intended to be the inverse
 * of `numericToCalendar`.
 */
test("calendarToNumeric is the inverse of numericToCalendar", () => {
  Object.keys(augurDates).forEach((calendarDate) => {
    expect(calendarDate).toStrictEqual(numericToCalendar(calendarToNumeric(calendarDate)));
  });
});

test("Numeric dates can be converted to calendar dates and back again", () => {
  Object.values(augurDates).forEach((numericDate) => {
    const convertedNumDate = calendarToNumeric(numericToCalendar(numericDate));
    expect(numericDate).toBeCloseTo(convertedNumDate);
  });
});

test("getPreviousDate to nearest <X>", () => {
  const data = [
    {day: "2020-11-11", week: "2020-11-09", month: "2020-11-01", year: "2020-01-01", decade: "2020-01-01", century: "2000-01-01"},
    {day: "2020-12-03", week: "2020-11-30", month: "2020-12-01", year: "2020-01-01", decade: "2020-01-01", century: "2000-01-01"},
    {day: "2019-05-20", week: "2019-05-20", month: "2019-05-01", year: "2019-01-01", decade: "2015-01-01", century: "2000-01-01"}
  ];
  data.forEach((d) => {
    const dateObj = numericToDateObject(calendarToNumeric(d.day));
    Object.entries(d).forEach(([key, expectedDateString]) => {
      const unit = key.toUpperCase(); // e.g. "DAY", "YEAR"
      const shiftedDateString = dateToString(getPreviousDate(unit, dateObj));
      expect(shiftedDateString).toStrictEqual(expectedDateString);
    });
  });
});

test("getNextDate", () => {
  const data = [
    ["2020-12-11", {day: "2020-12-12", week: "2020-12-18", month: "2021-01-11", year: "2021-12-11", decade: "2030-12-11", century: "2120-12-11"}]
  ];
  data.forEach(([providedDate, nextDates]) => {
    const dateObj = numericToDateObject(calendarToNumeric(providedDate));
    Object.entries(nextDates).forEach(([key, expectedDateString]) => {
      const unit = key.toUpperCase(); // e.g. "DAY", "YEAR"
      const shiftedDateString = dateToString(getNextDate(unit, dateObj));
      expect(shiftedDateString).toStrictEqual(expectedDateString);
    });
  });
});


test("dates are prettified as expected", () => {
  expect(prettifyDate("DAY", "2020-01-05")).toStrictEqual("2020-Jan-05");
  expect(prettifyDate("YEAR", "2020-01-05")).toStrictEqual("2020-Jan-05"); // Not "2020" as we don't provide Jan 1st
  expect(prettifyDate("YEAR", "2020-01-01")).toStrictEqual("2020");
  expect(prettifyDate("MONTH", "2020-01-05")).toStrictEqual("2020-Jan-05");
  expect(prettifyDate("MONTH", "2020-01-01")).toStrictEqual("2020-Jan");
  expect(prettifyDate("CENTURY", "-3000-01-01")).toStrictEqual("-3000"); // BCE
});
