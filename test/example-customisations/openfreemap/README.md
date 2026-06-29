# Example Auspice extension using custom map styles

The customisation specifies an [openfreemap](https://openfreemap.org/) [MapLibre style document](https://maplibre.org/maplibre-style-spec/) using the [positron theme](https://github.com/openmaptiles/positron-gl-style):

> Positron is beautiful light base map which is ideal for a non obtrusive basemap for your data visualizations. The cartography by Stamen Design is licensed under CC-BY. 

(I find this style to work nicely with the coloured demes Auspice draws on top of the map.)

You can test this via:

```sh
auspice develop \
  --extend test/example-customisations/openfreemap/auspice-client-customisation.json
```
