# Auspice Server API

The client makes requests to a server, for instance requesting a dataset file or requesting a listing of available datasets.
Charon is the name of the server.

**Extensions**
If you are customising a build of auspice, your server must listen for the following requests.
Alternatively, a serverless build of auspice may be made, which essentially hardcodes the source of these responses.
To handle these requests, it's easiest to write functions for each which, via the extension architecture, can be injected into the development server and easily deployed into a production server.

## `/charon/getAvailable`
Query arguments:
* `prefix` (optional) - the pathname of the requesting page in auspice.

Response shape:
```json
{
  "source": "(string)",
  "datasets": [
    "(array) available dataset"
  ],
  "narratives": [
    "(array) available narrative"
  ]
}
```


## `/charon/getDataset`
Query arguments:
* `prefix` (required)
* `type` (optional)

## `/charon/getNarrative`
Query arguments:
* `prefix` (required)
