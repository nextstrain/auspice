---
title: Building a custom server for auspice
---

> This should be about the new API, assuming that I implement it!

The Auspice client needs to make a number of requests to a server for:
* available datasets & narratives
* dataset JSON(s)
* Narrative markdown

For instance, when you run `auspice` locally, the default server scans a provided directory on your computer to create a list of available datasets, and delivers these files to the client for vizualisation when needed.


## Why would I need to create a custom server?

> You might not need to! If all your URLs correspond directly to asset paths, or can be made to with a simple transform, then using auspice to [generate a static site](build-static/introduction.md) may be much easier. 

> What's the difference between a custom server and a static site? I think more info on what a custom server is would be helpful here. -Cassia

* If you want to interpret URLs (perhaps to provide redirects), or deliver JSONs from different sources then a server might be needed.
For instance, nextstrain.org uses a server to access datasets stored on Amazon S3 buckets, and auspice.us uses a server to access community datasets on GitHub.
* If you want to generate datasets on the fly, or apply transformations to datasets.
For instance, this is how nextstrain.org is able to serve v1 JSONs -- it transforms them to v2 spec on the server.



## Providing custom API handlers to auspice's built-in server

> The following content is largely taken from the current v1 docs and needs to be update


The default auspice server contains handlers for the 3 API endpoints -- 
* `getAvailable(req, res)` which processes requests from `/charon/getAvailable` to return a list of available datasets and narratives.
* `getDataset(req, res)` which processes requests from `/charon/getDataset` -- return the requested dataset
* `getNarrative(req, res)` which processes requests from `/charon/getNarrative` -- return the requested narrative
see [the API docs](build-server/api.md) for more information on these.
The `req` and `res` arguments are express objects (TODO: provide link).


Customisations of auspice can provide their own handlers, allowing for multiple different use cases.
For instance, **auspice.us** (currently located as a subdirectory of auspice) contains handlers to fetch datasets from github repos ("community" builds).

#### Where are these "handlers" used?
During development of auspice, the dev-server needs access to these handlers in order to make process requests.
Building of the auspice client (`auspice build ...`) doesn't need to know about these handlers, as the client will simply make requests to the API detailed below. (Currently this is different for serverless builds, see [github.com/blab/ZEBOV](https://github.com/blab/ZEBOV) for an example).
Serving the auspice client (`auspice view ...`) will need to use these handlers.

#### Providing these handlers to `auspice build` and `auspice view`
The handlers should be defined in a javascript file provided to those commands via the `--handlers` argument. This file should export three functions via:
```js
module.exports = {
  getAvailable,
  getDataset,
  getNarrative
};
```

Here's a pseudocode example of one of these functions.

```js
const getAvailable = (req, res) => {
  try {
    /* collect available data */
    res.json(data);
  } catch (err) {
    res.statusMessage = `error message to display in client`;
    console.log(res.statusMessage); /* printed by the server */
    return res.status(500).end();
  }
};
```




## Building a custom server

TODO
