import { waitUntilScreenStable } from "./helpers";

describe("Zika", () => {
  it("displays the title on the page", async () => {
    await goToZikaPage();
    await expect(page).toMatch("Real-time tracking of Zika virus evolution");
  });

  it("clicks `Play` on the `TransmissionsCard`", async () => {
    await goToZikaPage();

    await expect(page).toClick("button", { text: "Play" });

    await expect(page).toMatchElement("button", { text: "Pause" });
  });

  describe("Color by", () => {
    describe("author", () => {
      it("matches the screenshot", async () => {
        await toMatchImageSnapshot("author", async () => {
          await page.keyboard.press("ArrowUp");
          await page.keyboard.press("Enter");
        });
      });
    });

    describe("country", () => {
      it("matches the screenshot", async () => {
        await toMatchImageSnapshot("country", () => {});
      });
    });

    describe("date", () => {
      it("matches the screenshot", async () => {
        await toMatchImageSnapshot("date", async () => {
          await page.keyboard.press("ArrowUp");
          await page.keyboard.press("ArrowUp");
          await page.keyboard.press("Enter");
        });
      });
    });

    describe("region", () => {
      it("matches the screenshot", async () => {
        await toMatchImageSnapshot("region", async () => {
          await page.keyboard.press("ArrowDown");
          await page.keyboard.press("Enter");
        });
      });
    });
  });
});

async function toMatchImageSnapshot(option, selectOptionTest) {
  await goToZikaPage();

  const colorBySelector = await expect(page).toMatchElement("#selectColorBy");

  await colorBySelector.click();

  await selectOptionTest();

  await expect(colorBySelector).toMatch(option);

  const treeTitle = await expect(page).toMatchElement("#Title");

  await expect(treeTitle).toMatch(option);

  await waitUntilScreenStable();

  const image = await page.screenshot();

  /**
   * (tihuan): Apply `blur` to ignore minor noises.
   * Also `` is needed, since we use `jest.retryTimes()`
   * https://github.com/americanexpress/jest-image-snapshot/pull/122/files
   * https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
   */
  expect(image).toMatchImageSnapshot({ blur: 2, customSnapshotIdentifier: `Color by: ${option}` });
}

async function goToZikaPage() {
  await page.goto(`${BASE_URL}/zika?p=grid`, { waitUntil: "networkidle2" });
  await expect(page).toMatchElement("#TransmissionsCard");
}
