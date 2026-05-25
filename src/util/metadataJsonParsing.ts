import type { Metadata } from "../reducers/metadata.types";

/* control ability to share / download assets */
export function computeMetadataSharing(
  metadataState: Partial<Metadata>,
  userData: any,
): Metadata['sharing'] {

  /** begin with defaults */
  const sharing: Metadata['sharing'] = {
    dataset_json: true,
    metadata_tsv: true,
    authors: true,
    trees: true,
    entropy: true,
    screenshot: true
  }

  for (const [key, value] of Object.entries(_parseJsonSharingData(userData, Object.keys(sharing)))) {
    sharing[key] = value;
  }

  /* Hardcode overrides for GISAID datasets */
  const gisaid = (metadataState?.dataProvenance || []).filter((el) => el.name.toUpperCase() === 'GISAID').length > 0;
  if (gisaid) {
    sharing.dataset_json = false;
    sharing.metadata_tsv = false;
    sharing.gisaid_acknowledgments = true;
  }

  return sharing;
}


function _parseJsonSharingData(data: any, validKeys: string[]): Partial<Metadata['sharing']> {
  if (data === undefined) return {};
  if (!(typeof data === 'object' && !Array.isArray(data) && data !== null)) {
    console.warn(`JSON.metadata.sharing must be an object (dict)`);
    return {};
  }
  return Object.fromEntries(
    Object.entries(data)
      .map(([key, value]): [string,boolean]|null => {
        if (!validKeys.includes(key)) {
          console.warn(`JSON.metadata.sharing.${key} is not a valid key`);
          return null;
        }
        if (value !== false && value !== true) {
          console.warn(`JSON.metadata.sharing.${key} must be a boolean value, not ${value}`);
          return null;
        }
        return [key, value]
      })
      .filter((x) => !!x)
  )
}
