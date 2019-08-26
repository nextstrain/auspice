---
title: Auspice Server API
---

> This API is largely based off the interface used by nextstrain.
Most probably it will change dramatically over the coming weeks.

The client (i.e. the auspice web page) makes requests to a server, for instance requesting a dataset file or requesting a listing of available datasets.
The server is referred to as "charon".
Currently the server needs to handle three requests (detailed below), which are made to the same domain as the client (this may be changeable in the future).


Auspice by itself includes handlers for these requests.
These handlers source data from the local filesystem so that running auspice without extensions can view locally available datasets.


Customisations of auspice can provide their own handlers, allowing for multiple different use cases.
For instance, **auspice.us** (currently located as a subdirectory of auspice) contains handlers to fetch datasets from github repos ("community" builds). The handlers used in **nextstrain.org** fetch datasets from S3 buckets.


## Where are these "handlers" used?
During development of auspice, the dev-server needs access to these handlers in order to make process requests.
Building of the auspice client (`auspice build ...`) doesn't need to know about these handlers, as the client will simply make requests to the API detailed below. (Currently this is different for serverless builds, see [github.com/blab/ZEBOV](https://github.com/blab/ZEBOV) for an example).
Serving the auspice client (`auspice view ...`), or whatever custom server implementation you design, will need to use these handlers.

## Providing these handlers to `auspice build` and `auspice view`
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



# API description

Currently the client makes three requests:
* `/charon/getAvailable` -- return a list of available datasets and narratives
* `/charon/getDataset` -- return the requested dataset
* `/charon/getNarrative` -- return the requested narrative

You can choose to handle these in your own server, or provide handlers to the auspice (dev-)server which are called whenever these requests are received (see above).

## get available datasets: `/charon/getAvailable`

Query arguments:
* `prefix` (optional) - the pathname of the requesting page in auspice.

Response shape:
```json
{
  "datasets": [
    {"request": "URL of a dataset. Will become the prefix in a getDataset request"},
    ...
  ],
  "narratives": [
    {"request": "URL of a narrative. Will become the prefix in a getNarrative request"},
    ...
  ]
}
```

## get a dataset: `/charon/getDataset`

Query arguments:
* `prefix` (required) - the pathname of the requesting page in auspice. Use this to determine which dataset to return.
* `deprecatedSecondTree` (optional) - deprecated.
* `type` (optional) -- if specified, then the request is for an additional file (e.g. "tip-frequencies"), not the main dataset.

Response shape:
> This needs to be updated to schema 2.0. These docs should point to the schema definitions (currently in the augur repo).

The current main dataset response shape is:
```json
{
  "meta": "the schema 1.0 metadata json object",
  "tree": "the schema 1.0 tree json object",
  "_source": "the source (e.g. live, staging, github). Only used by the sidebar dataset selector",
}
```

## get a narrative: `/charon/getNarrative`
> to do
