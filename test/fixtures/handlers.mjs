/**
 * Fixture custom handlers for `scripts/test-npm-package`, which checks that
 * `auspice view --handlers <file>` can load a user-supplied handlers file from
 * outside the installed package. See `test/fixtures/handlers.mts` for the
 * TypeScript equivalent.
 *
 * Only `getAvailable` is exercised; the other two are present because
 * `--handlers` requires all three to be exported.
 */

export const getAvailable = (_req, res) => {
  res.json({
    datasets: [{request: "fixture/dataset"}],
    narratives: []
  });
};

export const getDataset = (_req, res) => {
  res.status(404).type("text/plain").send("no datasets in this fixture");
};

export const getNarrative = (_req, res) => {
  res.status(404).type("text/plain").send("no narratives in this fixture");
};
