/**
 * In November 2020 we moved the auspice documentation from github pages
 * to docs.nextstrain.org. In order to create redirects from the former
 * to the latter, we need to create simple HTML pages at each github-pages
 * page which instruct the client to redirect. This script exists to automate
 * the creation of such HTML files.
 * See https://opensource.com/article/19/7/permanently-redirect-github-pages.
 *
 * The GitHub pages were sourced from the `/docs` directory of the `master`
 * branch. This script & the resulting HTML redirects are intended to live
 * on the `redirect-documentation` branch, where gh-pages are to be sourced.
 */

const fs = require("fs");
const path = require("path");

/* ------------------------------------------------------------------------ */

const mainRTD = `https://docs.nextstrain.org/en/latest`;
const auspiceRTD = `https://docs.nextstrain.org/projects/auspice/en/latest`;

const redirects = [
  // MAIN DOCS SPLASH
  [`https://nextstrain.github.io/auspice/`, `${auspiceRTD}`],
  // INTRODUCTION
  [`https://nextstrain.github.io/auspice/introduction/overview`, `${auspiceRTD}`],
  [`https://nextstrain.github.io/auspice/introduction/install`, `${auspiceRTD}/introduction/install.html`],
  [`https://nextstrain.github.io/auspice/introduction/how-to-run`, `${auspiceRTD}/introduction/how-to-run.html`],
  // ADVANCED FUNTIONALITY
  [`https://nextstrain.github.io/auspice/advanced-functionality/second-trees`, `${auspiceRTD}/advanced-functionality/second-trees.html`],
  [`https://nextstrain.github.io/auspice/advanced-functionality/view-settings`, `${auspiceRTD}/advanced-functionality/view-settings.html`],
  [`https://nextstrain.github.io/auspice/advanced-functionality/drag-drop-csv-tsv`, `${auspiceRTD}/advanced-functionality/drag-drop-csv-tsv.html`],
  [`https://nextstrain.github.io/auspice/advanced-functionality/misc`, `${auspiceRTD}/advanced-functionality/misc.html`],
  // CUSTOMISING AUSPICE
  [`https://nextstrain.github.io/auspice/customise-client/introduction`, `${auspiceRTD}/customise-client/index.html`],
  [`https://nextstrain.github.io/auspice/customise-client/api`, `${auspiceRTD}/customise-client/api.html`],
  [`https://nextstrain.github.io/auspice/customise-client/requests`, `${auspiceRTD}/customise-client/requests.html`],
  // USING A CUSTOM SERVER
  [`https://nextstrain.github.io/auspice/server/introduction`, `${auspiceRTD}/server/index.html`],
  [`https://nextstrain.github.io/auspice/server/api`, `${auspiceRTD}/server/api.html`],
  [`https://nextstrain.github.io/auspice/server/authentication`, `${auspiceRTD}/server/authentication.html`],
  // NARRATIVES
  [`https://nextstrain.github.io/auspice/narratives/introduction`, `${mainRTD}/guides/communicate/narratives-intro.html`],
  [`https://nextstrain.github.io/auspice/narratives/how-to-write`, `${mainRTD}/tutorials/narratives-how-to-write.html`],
  [`https://nextstrain.github.io/auspice/narratives/create-pdf`, `${mainRTD}/guides/communicate/create-pdf.html`],
  // RELEASES
  [`https://nextstrain.github.io/auspice/releases/changelog`, `${auspiceRTD}/releases/changelog.html`],
  [`https://nextstrain.github.io/auspice/releases/v2`, `${auspiceRTD}/releases/v2.html`],
  // CONTRIBUTING
  [`https://nextstrain.github.io/auspice/contributing/overview`, `${mainRTD}/guides/contribute/auspice-develop.html`]
];

function generateHtml(newUrl) {
  return `
    <!DOCTYPE HTML>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta http-equiv="refresh" content="0;url=${newUrl}" />
            <link rel="canonical" href="${newUrl}" />
        </head>
        <body>
            <h3>
              Auspice's documentation is now hosed on <a href="https://docs.nextstrain.org">docs.nextstrain.org</a>
            </h2>
            <p>
              This particular page has been moved to <a href="${newUrl}">${newUrl}</a>
            </p>
        </body>
    </html>
  `;
}

/**
 * There are 2 HTML files for most "normal" gh-pages URL reflecting the 2 valid URLs:
 * https://nextstrain.github.io/auspice/releases/changelog and
 * https://nextstrain.github.io/auspice/releases/changelog/index.html
 */
function githubPagesUrlToFilenames(url) {
  const subFolderStruct = url.replace("https://nextstrain.github.io/auspice", "");
  const fnames = [
    path.join(__dirname, "..", "docs", subFolderStruct) + ".html",
    path.join(__dirname, "..", "docs", subFolderStruct, "index.html")
  ];
  if (subFolderStruct==="/") return [fnames[1]];
  return fnames;
}


/* ------------------------------------------------------------------- */
function main() {
  redirects.forEach(([oldUrl, newUrl]) => {

    githubPagesUrlToFilenames(oldUrl).forEach((fname) => {
      if (!fs.existsSync(path.dirname(fname))) {
        fs.mkdirSync(path.dirname(fname));
      }
      fs.writeFileSync(fname, generateHtml(newUrl), {encoding: "utf8"});
    });
  });
}
main();
