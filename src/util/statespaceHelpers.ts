
type MapDisplayType = 'statespace' | 'geographic';

/**
 * TODO XXX
 */
export function getMapTypesAvailable({
  currentMapDisplayType,
  currentMapDisplayTypesAvailable,
  newGeoResolution,
  geoResolutions
}: {
  currentMapDisplayType: any // TODO XXX
  currentMapDisplayTypesAvailable: any// TODO XXX
  newGeoResolution: any// TODO XXX
  geoResolutions: any// TODO XXX
}): {
  mapDisplayType: MapDisplayType
  mapDisplayTypesAvailable: MapDisplayType[]
} {// TODO XXX
  const geoResJsonData = geoResolutions.filter((x) => x.key === newGeoResolution)[0];
  const latLongsAvailable = !!geoResJsonData.demes;
  const mapDisplayTypesAvailable: MapDisplayType[] = latLongsAvailable ? ['statespace', 'geographic'] : ['statespace'];

  /* If we're going from a resolution with only states to one with geo as well, we switch to geo representation
     If we're going from a resolution with both to another resolution with both, we keep the old selection */
  const mapDisplayType = mapDisplayTypesAvailable.length === 1
    ? mapDisplayTypesAvailable[0]
    : currentMapDisplayTypesAvailable.length === 1 // note: length can be zero (e.g. on load)
      ? "geographic"
      : currentMapDisplayType;

  return { mapDisplayType, mapDisplayTypesAvailable };
}
  