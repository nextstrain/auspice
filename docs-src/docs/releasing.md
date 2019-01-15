---
title: Releasing auspice
---

> This page is a stub. It will contain instructions on how to publish auspice to npm.


## Releasing new versions.
You will need push access to [github.com/nextstrain/auspice](http://github.com/nextstrain/auspice), and local `master` must be up-to-date.
Releasing should then be as simple as running `./releaseNewVersion` and following the prompts.




## Deploying to npm
This should be handled automatically when releases happen (assuming that the TravisCI build passes).
To do this manually:
* ensure your npm account is registered with [npmjs.com/package/auspice](https://www.npmjs.com/package/auspice)
* build the `bundle.js` via `npm run build`
* ensure the version number (`node server.js --version`) is different to [npmjs.com/package/auspice](https://www.npmjs.com/package/auspice)
* `npm publish`
