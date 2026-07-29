/**
 * The TypeScript twin of `test/fixtures/handlers.mjs`, used by
 * `scripts/test-npm-package` to check that a user-supplied `--handlers` file
 * can be TypeScript. Such files live in the user's own project rather than
 * under `node_modules`, so Node strips their types on the fly.
 *
 * Keep this to erasable syntax only (no `enum`, no runtime `namespace`, no
 * parameter properties, no decorators) -- that is what Node supports.
 */

interface Available {
  datasets: {request: string}[];
  narratives: {request: string}[];
}

const available: Available = {
  datasets: [{request: "fixture/dataset"}],
  narratives: []
};

export const getAvailable = (_req, res): void => {
  res.json(available);
};

export const getDataset = (_req, res): void => {
  res.status(404).type("text/plain").send("no datasets in this fixture");
};

export const getNarrative = (_req, res): void => {
  res.status(404).type("text/plain").send("no narratives in this fixture");
};
