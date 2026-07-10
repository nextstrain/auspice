# Auspice extension to use our old MapBox map styles

The customisation here uses the MapBox tiles & styling which was the default in Auspice v1 & v2.

> NOTE: This relies on an access token which, as of mid-2026, is restricted to specific domains.
  We may remove access at some point in the future.


This customisation serves two purposes:

1. Development usage to compare our old styles vs new ones.

2. An example of how to use MapBox styles in Auspice

The MapBox style sheet inlined in the `auspice-client-customisation.json` are in MapLibre format.
We used `scripts/transform-mapbox-style-json.js` to transform the MapBox style sheet, including its proprietary `mapbox://` references, into MapLibre format. This uses a placeholder `<ACCESS_TOKEN>` string which is replaced at runtime with the JSON-defined `accessToken`, see https://docs.nextstrain.org/projects/auspice/en/stable/customise-client/api.html.


You can use this extension via:

```sh
auspice develop \
  --extend test/example-customisations/mapbox/auspice-client-customisation.json \
  <dataset_dir>
```
