import { computeReleaseVersion } from "../scripts/compute-release-version";

/* Shorthand: the arguments a release is computed from, with a plausible default for the
 * ones a given test doesn't care about.
 */
const compute = (args) => computeReleaseVersion({currentVersion: "2.73.0", label: "none", branch: "master", ...args});
const version = (args) => compute(args).version;

describe("normal releases from master", () => {
  test("major", () => {
    expect(version({bump: "major"})).toEqual("3.0.0");
  });
  test("feat is a semver minor", () => {
    expect(version({bump: "feat"})).toEqual("2.74.0");
  });
  test("minor is a semver patch", () => {
    expect(version({bump: "minor"})).toEqual("2.73.1");
  });
  test("promote strips the prerelease suffix", () => {
    expect(version({bump: "promote", currentVersion: "3.0.0-alpha.2"})).toEqual("3.0.0");
  });
  test("promote doesn't infer a base version", () => {
    /* The case semver.inc() gets wrong: 3.1.0-alpha.2 + major would be 4.0.0 */
    expect(version({bump: "promote", currentVersion: "3.1.0-alpha.2"})).toEqual("3.1.0");
  });
});

describe("prereleases from other branches", () => {
  test("major starts a new premajor series", () => {
    expect(version({bump: "major", label: "alpha", branch: "v3"})).toEqual("3.0.0-alpha.0");
  });
  test("feat starts a new preminor series", () => {
    expect(version({bump: "feat", label: "alpha", branch: "v3"})).toEqual("2.74.0-alpha.0");
  });
  test("minor starts a new prepatch series", () => {
    expect(version({bump: "minor", label: "alpha", branch: "v3"})).toEqual("2.73.1-alpha.0");
  });
  test("continue increments within the series", () => {
    expect(version({bump: "continue", label: "alpha", branch: "v3", currentVersion: "3.0.0-alpha.0"})).toEqual("3.0.0-alpha.1");
  });
  test("continue can move the series to a later label", () => {
    expect(version({bump: "continue", label: "beta", branch: "v3", currentVersion: "3.0.0-alpha.1"})).toEqual("3.0.0-beta.0");
  });
  test("labels other than alpha work too", () => {
    expect(version({bump: "major", label: "rc", branch: "v3"})).toEqual("3.0.0-rc.0");
  });
});

describe("rule 1: master cannot make a prerelease", () => {
  test("a label is rejected", () => {
    expect(() => compute({bump: "feat", label: "alpha"})).toThrow(/cannot be prereleases/);
  });
  test("continue is rejected", () => {
    expect(() => compute({bump: "continue", currentVersion: "3.0.0-alpha.1"})).toThrow(/not valid on master/);
  });
});

describe("rule 2: other branches cannot make a normal release", () => {
  test("label=none is rejected", () => {
    /* The core requirement of the whole design */
    expect(() => compute({bump: "feat", label: "none", branch: "v3"})).toThrow(/must be prereleases/);
  });
  test("promote is rejected", () => {
    expect(() => compute({bump: "promote", label: "alpha", branch: "v3", currentVersion: "3.0.0-alpha.1"})).toThrow(/only valid on master/);
  });
});

describe("rule 3: continue requires an existing prerelease", () => {
  test("a stable current version is a user error, not a silent patch bump", () => {
    expect(() => compute({bump: "continue", label: "alpha", branch: "v3", currentVersion: "2.73.0"})).toThrow(/requires the current version \(2\.73\.0\) to already be a prerelease/);
  });
});

describe("rule 4: promote requires an existing prerelease", () => {
  test("a stable current version is rejected", () => {
    expect(() => compute({bump: "promote", currentVersion: "2.73.0"})).toThrow(/requires the current version \(2\.73\.0\) to already be a prerelease/);
  });
});

describe("rule 5: master + a prerelease current version is ambiguous", () => {
  /* Once v3 merges into master, package.json reads e.g. 3.0.0-alpha.2 and semver.inc()
   * silently collapses all three levels to 3.0.0.
   */
  test.each(["major", "feat", "minor"])("%s is rejected rather than silently returning 3.0.0", (bump) => {
    expect(() => compute({bump, currentVersion: "3.0.0-alpha.2"})).toThrow(/is a prerelease, so bump/);
  });
  test("the error points at promote, with the version it would produce", () => {
    expect(() => compute({bump: "feat", currentVersion: "3.1.0-alpha.2"})).toThrow(/release it as 3\.1\.0/);
  });
});

describe("rule 6: versions never go backwards", () => {
  test("rc -> alpha is rejected", () => {
    expect(() => compute({bump: "continue", label: "alpha", branch: "v3", currentVersion: "3.0.0-rc.0"}))
      .toThrow(/3\.0\.0-alpha\.0 is not greater than the current version 3\.0\.0-rc\.0/);
  });
  test("beta -> alpha is rejected", () => {
    expect(() => compute({bump: "continue", label: "alpha", branch: "v3", currentVersion: "3.0.0-beta.3"})).toThrow(/not greater than/);
  });
});

describe("argument validation", () => {
  test("unknown bump", () => {
    expect(() => compute({bump: "patch"})).toThrow(/Unknown bump/);
  });
  test("unknown label", () => {
    expect(() => compute({bump: "feat", label: "dev", branch: "v3"})).toThrow(/Unknown label/);
  });
  test("missing branch", () => {
    expect(() => compute({bump: "feat", branch: ""})).toThrow(/branch is required/);
  });
  test("invalid current version", () => {
    expect(() => compute({bump: "feat", currentVersion: "2.73"})).toThrow(/not a valid semver version/);
  });
});

describe("other computed fields", () => {
  test("normal release", () => {
    expect(compute({bump: "feat"})).toEqual({
      version: "2.74.0",
      tag: "v2.74.0",
      distTag: "latest",
      description: "feature release"
    });
  });
  test("prerelease", () => {
    expect(compute({bump: "major", label: "alpha", branch: "v3"})).toEqual({
      version: "3.0.0-alpha.0",
      tag: "v3.0.0-alpha.0",
      distTag: "next",
      description: "alpha prerelease"
    });
  });
  test("promotion", () => {
    expect(compute({bump: "promote", currentVersion: "3.0.0-alpha.2"})).toEqual({
      version: "3.0.0",
      tag: "v3.0.0",
      distTag: "latest",
      description: "release (promoted from 3.0.0-alpha.2)"
    });
  });
});

describe("the documented prerelease series stays in order", () => {
  test("2.73.0 -> 3.0.0-alpha.0 -> alpha.1 -> beta.0 -> rc.0 -> 3.0.0", () => {
    const series = ["2.73.0"];
    const next = (args) => series.push(version({currentVersion: series[series.length-1], ...args}));

    next({bump: "major", label: "alpha", branch: "v3"});
    next({bump: "continue", label: "alpha", branch: "v3"});
    next({bump: "continue", label: "beta", branch: "v3"});
    next({bump: "continue", label: "rc", branch: "v3"});
    next({bump: "promote"});

    expect(series).toEqual(["2.73.0", "3.0.0-alpha.0", "3.0.0-alpha.1", "3.0.0-beta.0", "3.0.0-rc.0", "3.0.0"]);
  });
});
