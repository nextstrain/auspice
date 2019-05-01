# Auspice Documentation

This folder contains the static site generator and the markdown files which form the auspice documentation website.
This is currently designed to be served from GitHub pages using the `auspice/docs` folder.
[Docusaurus](https://docusaurus.io/) is used to generate the static site.

### Folder structure of `auspice/docs-src/`
* `README.md` this file
* `docs/` contains the raw markdown files. The filenames (and directory names) will be used as URLs.
New pages here should also be added to `sidebars.json`.
* `website/` the files needed to build the website.
  * `./sidebars.json` define the doc links in the sidebar
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
