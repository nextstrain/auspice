const {readFileSync} = require('fs');
const {decode} = require('quoted-printable');

const testCases = [];

// Load a suite of smoke tests from a simple text file. File is of the format:
// [path], [comma separated text assertions]
const text = readFileSync(require.resolve('./urls.txt'), 'utf8').trim();
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

describe("smoke test rendering of paths in urls.txt", () => {
  for (const testCase of testCases) {
    // eslint-disable-next-line no-loop-func
    it(`it appropriately renders ${testCase.path}`, async () => {
      const url = `${BASE_URL}${testCase.path}`;
      const resp = await page.goto(url, { waitUntil: 'networkidle2' });
      expect(resp.status()).toEqual(200);
      // Create a Devtools session for fetching MIME HTML snapshot:
      const client = await page.target().createCDPSession();
      await client.send('Page.enable');
      // Takes a MIME HTML snapshot of page, and makes sure it contains
      // our smoke test text content:
      const snapshotText = decode((await client.send('Page.captureSnapshot')).data);
      for (const assertion of testCase.assertions) {
        try {
          expect(snapshotText).toEqual(expect.stringContaining(assertion));
        } catch (_err) {
          throw Error(`could not find text "${assertion}" on page ${testCase.path}`);
        }
      }
    });
  }
});
