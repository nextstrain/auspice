import {viruses} from "./globals";

const shouldFetchDataset = (queryParams) => {

  /*
    Cases:
      false: there is no virus
      false: there is a virus, but virus has strain and no strain is selected
      false: there is a virus and a strain, but no duration selected
      true: there is a virus, strain and duration in the query params
      true: there is a virus, and strains is null

  */

  let bool;

  if (!queryParams.virus) {
    bool = false;
  } else if (
    queryParams.virus &&
    (viruses[queryParams.virus].strains &&
    !queryParams.strain)
  ) {
    bool = false;
  } else if (
    queryParams.virus &&
    (viruses[queryParams.virus].strains &&
    queryParams.strain) &&
    !queryParams.duration
  ) {
    bool = false;
  } else if (queryParams.virus && queryParams.strain && queryParams.duration) {
    bool = true;
  } else if (queryParams.virus && !viruses[queryParams.virus].strains) {
    bool = true;
  } else {
    /* fall through warning in case we make a bad request, don't fail silently */
    console.warn("Unexpected combination of viruses, strains and or durations. Check query params provided to shouldFetchDataset.")
  }

  return bool;
};

export default shouldFetchDataset;
