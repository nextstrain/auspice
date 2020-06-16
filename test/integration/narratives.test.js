/* eslint-disable no-await-in-loop */
import { toMatchImageSnapshot } from './helpers';

const fetch = require('node-fetch');

/**
 * The first snapshot test of a narrative. Hopefully there can
 * be many more to come -- narratives are a great way to expose
 * test lots of functionality and are also useful to explain
 * bugs.
 */

describe("Simultaneous Tree Updates", () => {

  /**
   * If we let jest retry tests then understanding the order-of-events gets rather complicated.
   * These tests may also take a long time due to the sequential design & the `waitFor` calls.
   */
  jest.retryTimes(0);
  jest.setTimeout(120000);

  let numberPagesInNarrative; // not including the title page (n=0) or the final page, inserted by the client
  beforeAll(async () => {
    numberPagesInNarrative = await fetch(`${BASE_URL}/charon/getNarrative?prefix=test/simultaneous-tree-updates`)
      .then((res) => res.json())
      .then((res) => res.length);
  });

  beforeEach(async () => {
    // Note: The docs https://jestjs.io/docs/en/puppeteer indicate that we should be able to run this set-up
    // code in the `beforeAll` block, however this doesn't work for us (reason unknown).
    await page.goto(`${BASE_URL}/narratives/test/simultaneous-tree-updates`, { waitUntil: "networkidle2" });
    await expect(page).toMatchElement("#PhylogenyCard");
  });

  /* note that we cannot dynamically create `it` tests (i.e. in a for loop) -- https://github.com/facebook/jest/issues/1619 */
  it(`Checking that each page in the narrative matches the screenshot`, async () => {
    for (let i=0; i<=numberPagesInNarrative; i++) {
      // console.log(`-----------------------\nnarratives-simultaneous-tree-updates-slide-${i}`)
      await matchScreenshot(`narratives-simultaneous-tree-updates-slide-${i}`);
      await page.keyboard.press("ArrowDown"); // move to next slide in preparation for next slide's screenshot
      // because transitions happen when navigating between pages, if we don't wait a while then the screenshot
      // will be created mid-transition! Ideally this would only run when we're updating screenshots (where is
      // this flag stored?), as the comparison function will retry a few times until it matches.
      await page.waitFor(5000);
    }
  });

});


async function matchScreenshot(id) {

  await toMatchImageSnapshot(
    async () => {
      const image = await page.screenshot();
      /**
       * (tihuan): Apply `blur` to ignore minor noises.
       * Also `customSnapshotIdentifier` is needed, since we use `jest.retryTimes()`
       * https://github.com/americanexpress/jest-image-snapshot/pull/122/files
       * https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
       */
      const SNAPSHOT_CONFIG = {
        blur: 2,
        customSnapshotIdentifier: id
      };
      expect(image).toMatchImageSnapshot(SNAPSHOT_CONFIG);
    }
  );
}

