# Auspice Documentation

This folder contains the static site generator and the markdown files which form the auspice documentation website.
This is currently designed to be served from github pages.
[Docusaurus](https://docusaurus.io/) is used to generate the static site.

### Folder structure:
* `README.md` this file
* `docs/` contains the raw markdown files. The filenames (and directory names) will be used as URLS.
* `website/` the files needed to build the website.
  * `website/sidebars.json` define the doc links in the sidebar
  * `website/pages/index.js` the splash page

### How to develop:
```bash
cd website
npx docusaurus-start
```

### How to deploy:

```bash
cd website
npx docusaurus-build # creates website/build/*
cd ..
mv website/build/sandbox/* ../docs # sandbox to be renamed auspice
```
