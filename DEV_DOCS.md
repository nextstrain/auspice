---
title: Contributing to Auspice development
---

Thank you for helping us to improve Nextstrain!

> **To get started, please see [the contributing guide](https://github.com/nextstrain/.github/blob/master/CONTRIBUTING.md) for useful information about how to pick an issue, submit your contributions, and so on.**

This project strictly adheres to the [Contributor Covenant Code of Conduct](https://github.com/nextstrain/.github/blob/master/CODE_OF_CONDUCT.md).

Please see the [project boards](https://github.com/orgs/nextstrain/projects) for currently available issues.

## Contributing code  
Code contributions are welcomed! [Please see the main auspice docs](https://nextstrain.github.io/auspice/introduction/install) for details on how to install and run auspice from source. 

Please comment on an open issue if you are working on it.
For changes unrelated to an open issue, please make an issue outlining what you would like to change/add.

Where possible, **please rebase** your work onto master rather than merging changes from master into your PR.

### Make sure tests are passing

When you submit a pull request to the auspice repository, a variety of integration and unit tests will need to pass before it can be merged.

You will likely want to run these tests locally before submitting:

First, install the dependencies with `npm i`, then:

#### For unit tests:

Run `npm test`.

#### For linting:

Run `npm run lint`. If there are issues run `npm run lint:fix`.

#### For integration tests:

> For integration tests to work, you'll need to have `git-lfs` installed (see below) as it stores the images that the snapshot tests will use.

1. Fetch the datasets with `npm run get-data` and `npm run get-narratives`.
2. Ensure you are **not** currently running the site locally, then run `npm run integration-test:ci`.

#### For smoke tests:

1. Fetch the datasets with `npm run get-data` and `npm run get-narratives`.
2. Ensure you are **not** currently running the site locally, then run `npm run smoke-test:ci`.

## git-lfs

We use [Git Large File Storage](https://github.com/git-lfs/git-lfs) to manage certain assets.
Currently these are limited to images within the `./test` directory (which we use for snapshot integration testing) but this may change in the future.
If you are not using these images, you don't need to have `git-lfs` installed; however **will not be able to run integration tests without it**.
See [here](https://git-lfs.github.com/) for installation instructions.

Helpful commands:
```bash
git lfs status
git lfs ls-files # list LFS tracked tiles
```


## Contributing to Documentation

Nextstrain documentation is available at [nextstrain.github.io/auspice/](https://nextstrain.github.io/auspice/).

This documentation is built from files contained within the Auspice GitHub repo -- see the [docs-src/README](https://github.com/nextstrain/auspice/tree/master/docs-src) within the `docs-src` directory for more details and instructions on how to contribute.

Note that currently the documentation must be rebuilt & pushed to GitHub _after_ a new version is released in order for the changelog to correctly appear at [nextstrain.github.io/auspice/releases/changelog](https://nextstrain.github.io/auspice/releases/changelog).


## Contributing to Internationalization and Localization (i18n/l18n)

If you can assist in efforts to translate the Auspice interface to more languages your assistance would be very much appreciated.
The currently available languages are displayed via a drop-down at the bottom of the sidebar.

#### Adding a new language:

  1) Add the language to the `getlanguageOptions` function in [this file](https://github.com/nextstrain/auspice/blob/master/src/components/controls/language.js#L24)
  2) If this is a new language, copy the folder (and the JSONs within it) `src/locales/en` and name it to match the language code for the new translation -- e.g. for Spanish this would be `src/locales/es`
  3) For each key-value in the JSONs, translate the english phrase to the new locale. (Do not modify the strings within `{{...}}` sections.)
  
  
For example, a spanish translation would change the English:
```json
  "sampled between {{from}} and {{to}}": "sampled between {{from}} and {{to}}",
  "and comprising": "and comprising",
```
to 
```json
  "sampled between {{from}} and {{to}}": "aislados entre {{from}} y {{to}}",
  "and comprising": "y compuesto de",
```

#### Helper script to check what parts of a translation are out-of-date or missing:

Run `npm run diff-lang -- X`, where `X` is the language you wish to check, for instance `es`.
This will display the strings which:
* need to be added to the translation
* are present but should be removed as they are no longer used
* are present but are simply a copy of the English version & need to be translated


> Running `npm run diff-lang` will check all available languages.

#### Improving an existing translation:

If a translation of a particular string is not yet available, then auspice will fall-back to the english version.

  1) Find the relevant key in the (EN) JSONs [in this directory](https://github.com/nextstrain/auspice/tree/master/src/locales/en)
  2) Add the key to the JSON with the same name, but in the directory corresponding to the language you are translating into (see above for an example).



## Releases & versioning
New versions are released via the `./releaseNewVersion.sh` script from an up-to-date `master` branch. It will prompt you for the version number increase, push changes to the `release` branch and, as long as Travis-CI is successful then a new version will be automatically published to [npm](https://www.npmjs.com/package/auspice).
