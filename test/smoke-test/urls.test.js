import {readFileSync} from 'fs';
import {expect, test} from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

const testCases = [];

// Load a suite of smoke tests from a simple text file. File is of the format:
// [path], [comma separated text assertions]
const text = readFileSync(new URL('./urls.txt', import.meta.url), 'utf8').trim();
for (const line of text.split(/\r?\n/)) {
  if (line.length === 0) continue; // allow for blank lines.
  if (line.match(/^#/)) continue; // allow for comments.
  const testCase = {assertions: []};
  line.split(/,/).forEach((token, i) => {
    if (i === 0) {
      // The first token is the path that we wish to traverse the headless
      // browser to:
      testCase.path = token;
    } else {
      // The remaining tokens represent blocks of text in the rendered page
      // we should check for:
      testCase.assertions.push(token.trimLeft());
    }
  });
  testCases.push(testCase);
}

test.describe("smoke test rendering of paths in urls.txt", () => {
  for (const testCase of testCases) {
    // eslint-disable-next-line no-loop-func
    test(`it appropriately renders ${testCase.path}`, async ({ page }) => {
      const resp = await page.goto(testCase.path, { waitUntil: 'networkidle' });
      expect(resp.status()).toEqual(200);
      // Retrieve the page contents, and make sure it contains our smoke test
      // text content:
      const content = await page.content();
      for (const assertion of testCase.assertions) {
        try {
          expect(content).toContain(assertion);
        } catch (_err) {
          throw Error(`could not find text "${assertion}" on page ${testCase.path}`);
        }
      }
    });
  }
});
