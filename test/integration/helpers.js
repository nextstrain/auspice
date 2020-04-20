/**
 * @param {function} assert Function that calls `page.screenshot()` and `expect(image).toMatchImageSnapshot()`
 * @param {object} options
 * @param options.timeoutMS The max timeout before failing the test in milliseconds
 * @param options.pollingMS The polling frequency in milliseconds
 */
export async function toMatchImageSnapshot(assert, options = {}) {
  const DEFAULT_TIMEOUT_MS = 10 * 1000;
  const DEFAULT_POLLING_MS = 100;

  const {
    timeoutMS = DEFAULT_TIMEOUT_MS,
    pollingMS = DEFAULT_POLLING_MS
  } = options;

  const startTime = Date.now();

  /**
   * (tihuan): We want `await` to complete before the next iteration
   */
  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await assert();
      break;
    } catch (error) {
      if (isTimeoutExceeded()) {
        throw error;
      }

      page.waitFor(pollingMS);

      continue;
    }
  }
  /* eslint-enable no-await-in-loop */

  function isTimeoutExceeded() {
    return Date.now() - startTime > timeoutMS;
  }
}
