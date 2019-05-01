---
title: API
---

> Should detail both the API endpoints, what's expected in the response.
Aso detail the exposed functions from `auspice` -- e.g. what you can get from `const { x, y } = require("auspice");`


# Current API description

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
* `type` (optional) -- if specified, then the request is for an additional file (e.g. "tip-frequencies"), not the main dataset.

Response shape:
Auspice v2.0 JSON -- see [data formats](introduction/data-formats.md)


## get a narrative: `/charon/getNarrative`
> to do
