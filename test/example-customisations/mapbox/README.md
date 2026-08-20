# Auspice extension to use our old MapBox map styles

The customisation here uses the MapBox tiles & styling which was the default in Auspice v1 & v2.

> NOTE: This relies on an access token which, as of mid-2026, is restricted to specific domains.
  We may remove access at some point in the future.


### Purpose of this customisation

1. Development usage to compare our old styles (mapbox) vs new ones (customised version of OpenMapTiles' positron theme).

2. An example of how to use MapBox styles in Auspice

### How the MapLibre-compatible style sheet was generated

The MapBox style sheet inlined in the `auspice-client-customisation.json` are in MapLibre format.
We used `scripts/transform-mapbox-style-json.js` to transform the MapBox style sheet, including its proprietary `mapbox://` references, into MapLibre format.
This uses a placeholder `<ACCESS_TOKEN>` string which is replaced at runtime with the JSON-defined `accessToken`, see https://docs.nextstrain.org/projects/auspice/en/stable/customise-client/api.html.

```sh
node scripts/transform-mapbox-style-json.js \
  'https://api.mapbox.com/styles/v1/trvrb/ciu03v244002o2in5hlm3q6w2?access_token=pk.ey...' \
  > src/util/mapbox-styles.json
```

### How to use the extension


```sh
auspice develop \
  --extend test/example-customisations/mapbox/auspice-client-customisation.json \
  <dataset_dir>
```
