import { waitUntilScreenSteady } from "./helpers";

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
    describe("date", () => {
      it("matches the screenshot", async () => {
        await goToZikaPage();

        const colorBySelector = await expect(page).toMatchElement("#selectColorBy");

        await colorBySelector.click();

        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("Enter");

        const EXPECTED_OPTION = "date";

        await expect(colorBySelector).toMatch(EXPECTED_OPTION);

        const treeTitle = await expect(page).toMatchElement("#Title");

        await expect(treeTitle).toMatch(EXPECTED_OPTION);

        await waitUntilScreenSteady();

        const image = await page.screenshot();

        /**
         * (tihuan): Apply `blur` to ignore minor noises.
         * Also `customSnapshotIdentifier` is needed, since we use `jest.retryTimes()`
         * https://github.com/americanexpress/jest-image-snapshot#%EF%B8%8F-api
         * https://github.com/americanexpress/jest-image-snapshot/pull/122/files
         */
        expect(image).toMatchImageSnapshot({ blur: 2, customSnapshotIdentifier: "Color by: date" });
      });
    });
  });
});

async function goToZikaPage() {
  await page.goto(`${BASE_URL}/zika?p=grid`, { waitUntil: "networkidle2" });
  await expect(page).toMatchElement("#TransmissionsCard");
}
