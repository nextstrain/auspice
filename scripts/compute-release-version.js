#!/usr/bin/env node
/* Compute (and validate) the version for a new Auspice release.
 *
 * Used by .github/workflows/release.yaml, but deliberately a plain script with no
 * dependency on the Actions environment so that it can be run locally, e.g.
 *
 *     node scripts/compute-release-version.js --bump=major --label=alpha --branch=v3
 *
 * and unit tested (see test/compute-release-version.test.js).
 *
 * The rules in one sentence: `master` produces normal releases, every other branch
 * produces prereleases, and neither can accidentally produce the other.
 */

const path = require('path');
const semver = require('semver');

const BUMPS = ["feat", "major", "minor", "continue", "promote"];
const LABELS = ["none", "alpha", "beta", "rc"];

/* `bump` is expressed in Auspice's own vocabulary (see the version.js history), which
 * doesn't line up with semver's names -- a "feature release" is a semver minor, and a
 * "minor fix" is a semver patch.
 */
const NORMAL_LEVELS = {major: "major", feat: "minor", minor: "patch"};
const PRERELEASE_LEVELS = {major: "premajor", feat: "preminor", minor: "prepatch"};

/* Used as the annotated tag's message, matching the wording of existing tags. */
const DESCRIPTIONS = {major: "major new release", feat: "feature release", minor: "minor fix"};

/**
 * Compute the new version from the current one.
 *
 * @param {object} args
 * @param {string} args.currentVersion version currently in package.json
 * @param {string} args.bump one of BUMPS
 * @param {string} args.label one of LABELS
 * @param {string} args.branch branch being released from
 * @returns {{version: string, tag: string, isPrerelease: boolean, description: string}}
 * @throws {Error} if the combination of arguments isn't a valid release
 */
function computeReleaseVersion({currentVersion, bump, label, branch}) {
  if (!BUMPS.includes(bump)) {
    throw new Error(`Unknown bump ${JSON.stringify(bump)}. Must be one of: ${BUMPS.join(", ")}`);
  }
  if (!LABELS.includes(label)) {
    throw new Error(`Unknown label ${JSON.stringify(label)}. Must be one of: ${LABELS.join(", ")}`);
  }
  if (!branch) {
    throw new Error(`A branch is required.`);
  }
  if (!semver.valid(currentVersion)) {
    throw new Error(`The current version ${JSON.stringify(currentVersion)} is not a valid semver version.`);
  }

  const onMaster = branch === "master";
  const currentIsPrerelease = semver.prerelease(currentVersion) !== null;

  /* Rule 1: master releases are normal releases, and nothing else. */
  if (onMaster) {
    if (label !== "none") {
      throw new Error(`Releases from master cannot be prereleases, so label must be "none" (got ${JSON.stringify(label)}). Dispatch from a non-master branch (e.g. v3) to make a prerelease.`);
    }
    if (bump === "continue") {
      throw new Error(`bump="continue" continues a prerelease series and so is not valid on master. Use "promote" to ship the current prerelease as a stable release.`);
    }
  }

  /* Rule 2: and non-master branches only ever produce prereleases. This is the core
   * requirement -- it's what stops a normal release escaping from v3.
   */
  if (!onMaster) {
    if (label === "none") {
      throw new Error(`Releases from ${branch} must be prereleases, so a label of "alpha", "beta" or "rc" is required. Only master can make a normal release.`);
    }
    if (bump === "promote") {
      throw new Error(`bump="promote" makes a stable release and so is only valid on master. Merge ${branch} into master first.`);
    }
  }

  /* Rules 3 & 4: both of these operate on an existing prerelease series. */
  if (bump === "continue" && !currentIsPrerelease) {
    throw new Error(`bump="continue" requires the current version (${currentVersion}) to already be a prerelease. Use "major", "feat" or "minor" to start a new prerelease series.`);
  }
  if (bump === "promote" && !currentIsPrerelease) {
    throw new Error(`bump="promote" requires the current version (${currentVersion}) to already be a prerelease. Use "major", "feat" or "minor" for a normal release.`);
  }

  let version;
  if (bump === "promote") {
    /* Deliberately not semver.inc(): see rule 5 for why inferring the level here would
     * mean different things at different points in a prerelease series.
     */
    const {major, minor, patch} = semver.parse(currentVersion);
    version = [major, minor, patch].join(".");
  } else if (onMaster) {
    /* Rule 5. semver.inc() would happily collapse 3.0.0-alpha.2 + major|minor|patch to
     * 3.0.0, because a prerelease is already "for" its base version -- but 3.1.0-alpha.2
     * + major gives 4.0.0, so the same input means different things depending on where in
     * the series you are. Refuse, and make the intent explicit instead.
     */
    if (currentIsPrerelease) {
      const {major, minor, patch} = semver.parse(currentVersion);
      throw new Error(`The current version (${currentVersion}) is a prerelease, so bump=${JSON.stringify(bump)} is ambiguous. Use bump="promote" to release it as ${major}.${minor}.${patch}.`);
    }
    version = semver.inc(currentVersion, NORMAL_LEVELS[bump]);
  } else if (bump === "continue") {
    version = semver.inc(currentVersion, "prerelease", label);
  } else {
    version = semver.inc(currentVersion, PRERELEASE_LEVELS[bump], label);
  }

  /* Rule 6: monotonicity. Catches e.g. 3.0.0-rc.0 + continue + alpha, which semver.inc()
   * resolves *backwards* to 3.0.0-alpha.0. Note that a range check would be wrong here:
   * semver.satisfies("3.0.0-alpha.0", ">2.73.0") is false, since ranges exclude
   * prereleases.
   */
  if (!semver.gt(version, currentVersion)) {
    throw new Error(`Computed version ${version} is not greater than the current version ${currentVersion}. Refusing to go backwards.`);
  }

  const isPrerelease = semver.prerelease(version) !== null;

  return {
    version,
    tag: `v${version}`,
    isPrerelease,
    description: isPrerelease ?
      `${label} prerelease` :
      bump === "promote" ? `release (promoted from ${currentVersion})` : DESCRIPTIONS[bump]
  };
}

function main(argv) {
  const args = {};
  for (const arg of argv) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!match) {
      throw new Error(`Unparseable argument ${JSON.stringify(arg)}. Expected --key=value.`);
    }
    args[match[1]] = match[2] === undefined ? true : match[2];
  }

  if (args.help) {
    console.log(`Usage: node scripts/compute-release-version.js --bump=BUMP --label=LABEL --branch=BRANCH [--current=VERSION] [--json]`);
    console.log(`  --bump     one of: ${BUMPS.join(", ")}`);
    console.log(`  --label    one of: ${LABELS.join(", ")}`);
    console.log(`  --branch   the branch being released from`);
    console.log(`  --current  the current version; defaults to the version in package.json`);
    console.log(`  --json     print all computed fields as JSON rather than just the version`);
    return;
  }

  const release = computeReleaseVersion({
    currentVersion: args.current || require(path.join(__dirname, '..', 'package.json')).version,
    bump: args.bump,
    label: args.label,
    branch: args.branch
  });

  console.log(args.json ? JSON.stringify(release) : release.version);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = {computeReleaseVersion, BUMPS, LABELS};
