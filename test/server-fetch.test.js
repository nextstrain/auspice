/**
 * Exercises the CLI's default `/charon/getDataset` handler against real on-disk
 * JSONs (provisioned into `test/fetched-jsons/` via `npm run fetch-test-data`).
 *
 * We stand up a minimal express server using the exact handler factory that
 * `auspice view` / `auspice develop` use, listen on an ephemeral port, and make
 * real HTTP requests so the streaming response path is exercised end-to-end.
 *
 * The `mumps` fixtures consist of a v2 dataset (`mumps.json`) plus its
 * tip-frequencies sidecar (`mumps_tip-frequencies.json`). The client requests
 * sidecars via the same getDataset route with a `type` query param, e.g.
 * `/charon/getDataset?prefix=mumps&type=tip-frequencies`
 * (see src/actions/loadData.js).
 */

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setUpGetDatasetHandler } from "../cli/server/getDataset.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.resolve(__dirname, "fetched-jsons");
const MAIN_FIXTURE = path.join(DATA_DIR, "mumps.json");
const SIDECAR_FIXTURE = path.join(DATA_DIR, "mumps_tip-frequencies.json");

const fixturesAvailable = fs.existsSync(MAIN_FIXTURE) && fs.existsSync(SIDECAR_FIXTURE);

/* The fetched JSONs are gitignored; skip (with a clear message) rather than fail
 * if they haven't been provisioned via `npm run fetch-test-data`. */
const describeOrSkip = fixturesAvailable ? describe : describe.skip;
if (!fixturesAvailable) {
  // eslint-disable-next-line no-console
  console.error(
    `[server-fetch.test] Skipping: fixtures missing in ${DATA_DIR}. ` +
    `Provision them with \`npm run fetch-test-data\`.`
  );
  process.exit(1)
}

describeOrSkip("CLI default getDataset handler", () => {
  let server;
  let baseUrl;

  beforeAll((done) => {
    const app = express();
    /* `dataPaths` mirrors the structure produced by `processPathArguments`:
     * an object mapping an absolute path to the set of data types to serve from it. */
    const dataPaths = { [DATA_DIR]: new Set(["datasets"]) };
    app.get("/charon/getDataset", setUpGetDatasetHandler(dataPaths));
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}/charon/getDataset`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it("serves the main (v2) dataset JSON (sanity check)", async () => {
    const res = await fetch(`${baseUrl}?prefix=mumps`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.version).toBe("v2");
    expect(json).toHaveProperty("tree");
  });

  it("serves the tip-frequencies sidecar JSON", async () => {
    const res = await fetch(`${baseUrl}?prefix=mumps&type=tip-frequencies`);
    expect(res.status).toBe(200);
    const json = await res.json();
    const expected = JSON.parse(fs.readFileSync(SIDECAR_FIXTURE, "utf8"));
    expect(json.pivots).toEqual(expected.pivots);
  });

  it("a valid prefix but unknown type is a 400 (Bad Request)", async () => {
    const res = await fetch(`${baseUrl}?prefix=mumps&type=foo`);
    expect(res.status).toBe(400);
  });

  it("dataset doesn't exist is a 404 (Not Found)", async () => {
    const res = await fetch(`${baseUrl}?prefix=foo`);
    expect(res.status).toBe(404);
  });

});
