---
title: Contributing to Auspice
---


> We have received a number of generous offers to contribute developer effort to nextstrain (and auspice).
We would be grateful for code contributions, as well as constructive criticism and advice.
A list of potential issues is being actively maintained at https://github.com/orgs/nextstrain/projects/5.


Auspice is developed via GitHub and issues and comments are very welcome -- [click here](https://github.com/nextstrain/auspice/issues/new) to create a new issue.
Alternatively, you can [email us](mailto:hello@nextstrain.org) with any questions or comments you may have.


## Contributing to Documentation

This documentation is all contained within the Auspice GitHub repo -- see [the README](https://github.com/nextstrain/auspice/tree/master/docs-src) within the `docs-src` directory for more details and instructions on how to contribute.


## Contributing to Development

We're very happy to have outside contributions to Auspice and see it grow.
If you are interested in contributing code then we would recommend that you create a [GitHub issue](https://github.com/nextstrain/auspice/issues/new) before spending time in the codebase.
For pull requests, please use [eslint](https://eslint.org/) as much as possible -- thanks!

## Contributing to Internationalization and Localization (i18n/l18n)

If you can assist in efforts to translate the Auspice interface to more languages
your assistance is very much appreciated.

  1) Add a language to [getLanguageOptions in the Language control.](https://github.com/nextstrain/auspice/blob/master/src/components/controls/language.js#L24) 
  2) If this is a new language, copy the folder `src/locales/en` and name it to
     match the language code for the new translation.
  3) For each entry, translate the english phrase to the new locale.


