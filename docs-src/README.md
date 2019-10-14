# Auspice Documentation

This folder contains the static site generator and the markdown files which form the auspice documentation website, served via GitHub pages at [nextstrain.github.io/auspice](https://nextstrain.github.io/auspice).
We are using [Docusaurus](https://docusaurus.io/) to generate the static site.


> Note that the code & content in this folder is used to generate the files in the `auspice/docs` directory, which are served by github pages.
Those files should not be modified, rather edit the contents of this directory & regenerate the documentation.


### Folder structure of `auspice/docs-src/`
* `README.md` this file
* `./docs/` contains the raw markdown files. The filenames (and directory names) will be used as URLs.
New pages here should also be added to `sidebars.json`.
* `./website/` the Docusaurus files needed to build the website.
  * `./sidebars.json` define the links in the sidebar
  * `./pages/index.js` the splash page
  * `./siteConfig.js` docusarus configuration - [see docs here](https://docusaurus.io/docs/en/site-config)


## How to run 

All commands run from this directory (`docs-src`).

#### Installing dependencies
```bash
npm install
# you must also have installed the dependencies from the parent directory (`auspice`)
```

#### Developing (live reloading etc):
```bash
npm run develop
```

#### (re-)build the static site

```bash
npm run build
```
> This command will modify the files in `../docs/` which is where the GitHub pages site is served from.

#### Deploy
Once changes are merged into the master branch and pushed to GitHub the changes will be live.
