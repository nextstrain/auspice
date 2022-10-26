
/** By default, datasets are sourced on the pathname alone, e.g. a narrative
 * may define https://nextstrain.org/zika but the pathname is extracted and turned
 * into an API call against the current host, i.e. `/charon/getDataset?prefix=zika`.
 *
 * This is how a narrative can define https://nextstrain.org/zika and work on auspice locally
 * (where the server will return the zika.json on disk) and on nextstrain.org (where
 * the nextstrain.org server will return our core zika.json from S3).
 *
 * For development purposes it can be useful to run auspice locally but make API requests to
 * nextstrain.org (e.g. so we can test groups functionality). Since we are running this on
 * localhost we can't actually hit nextstrain.org endpoints due to CORS (fair enough).
 * We can get around this by running a dev nextstrain.org server at localhost:5000 AND running
 * this auspice instance on port 8000 (as that port has cors disabled when in dev mode).
 *
 * This functionality should be considered dev-only!
 */

let CHARON_SERVER = false; /* eslint-disable-line prefer-const */
// SERVER_TO_USE = "http://localhost:5000"; // the nextstrain.org dev server, if you have it running. Note that you have to have auspice running on port 8000 for this to work.

export function updateApiCalls(datasets) {

  if (!CHARON_SERVER) return;

  for (const datasetName of Object.keys(datasets)) {
    const apiCalls = datasets[datasetName].apiCalls;
    for (const [fileType, previousURL] of Object.entries(apiCalls)) {
      const {pathname, search} = new URL(previousURL, "https://example.com");
      const newURL = new URL(CHARON_SERVER);
      newURL.pathname = pathname;
      newURL.search = search;
      apiCalls[fileType] = newURL.toString();
    }
  }
}
