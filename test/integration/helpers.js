const WAIT_BETWEEN_SCREENSHOTS_MS = 100;

export async function waitUntilScreenSteady() {
  const RETRY_TIMES = 5;
  let attempt = 0;

  /**
   * (tihuan): We want `await` to complete
   * before the next iteration
   */
  /* eslint-disable no-await-in-loop */
  while (attempt < RETRY_TIMES) {
    attempt++;

    const imageA = await page.screenshot();

    await page.waitFor(WAIT_BETWEEN_SCREENSHOTS_MS);

    const imageB = await page.screenshot();

    if (imageA.equals(imageB)) {
      break;
    } else {
      if (attempt === RETRY_TIMES) {
        throw new Error(`Screen not stable after ${RETRY_TIMES} tries`);
      }

      continue;
    }
  }
  /* eslint-enable no-await-in-loop */
}
