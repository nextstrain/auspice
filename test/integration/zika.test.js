describe("Zika", () => {
  it('displays the title on the page', async () => {
    await goToZikaPage()
    await expect(page).toMatch("Real-time tracking of Zika virus evolution");
  });

  it('clicks `Play` on the `TransmissionsCard`', async () => {
    await goToZikaPage()

    await expect(page).toMatchElement('#TransmissionsCard')

    await expect(page).toClick('button', { text: 'Play' })

    await expect(page).toMatchElement('button', { text: 'Pause' })
  })
});

async function goToZikaPage() {
  await page.goto(`${BASE_URL}/zika?p=grid`, { waitUntil: 'networkidle2' })
}
