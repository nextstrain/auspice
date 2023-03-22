import { continuousAttrValueToNumber } from "../src/util/castJsonTypes";

/**
 * function used to cast node values of continuous traits to numbers
 */
test("Continuous scale values are cast to Numbers or are undefined", () => {
  const numbers = ["123", "1e5", "1", "0", "-1", 0, 1, -1];
  const notNumbers = ["", "  ", " Infinity", "infinity", "Infinity", null, "abc", "", true, false, "true", undefined];
  numbers.forEach((n) => {
    const attr = {value: n};
    continuousAttrValueToNumber(attr); // modifies in place
    expect(typeof attr.value).toStrictEqual('number');
    expect(Number.isFinite(attr.value)).toBe(true);
  });
  notNumbers.forEach((n) => {
    const attr = {value: n};
    continuousAttrValueToNumber(attr); // modifies in place
    expect(attr.value).toBeUndefined();
  });
});
