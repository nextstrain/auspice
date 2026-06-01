# Example Auspice extension using custom map styles

This customisation specifies an [openfreemap](https://openfreemap.org/) [MapLibre style document](https://maplibre.org/maplibre-style-spec/) using the [positron theme](https://github.com/openmaptiles/positron-gl-style).
The positron theme is the basis of Auspice's current (highly customised) default map styles:

> Positron is beautiful light base map which is ideal for a non obtrusive basemap for your data visualizations. The cartography by Stamen Design is licensed under CC-BY. 

You can test this via:

```sh
auspice develop \
  --extend test/example-customisations/openfreemap/auspice-client-customisation.json \
  <dataset_dir>
```
