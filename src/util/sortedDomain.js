export const sortedDomain = (domain, attr, stateCount) => {
  /* sorting technique depends on the colorBy */
  const sorted = Array.from(domain);
  if (attr === "clade_membership") {
    sorted.sort();
  } else {
    sorted.sort(
      (a, b) =>
        stateCount.get(a) === stateCount.get(b)
          ? a < b ? -1 : 1
          : stateCount.get(a) > stateCount.get(b) ? -1 : 1
    );
  }
  return sorted;
};
