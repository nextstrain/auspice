import {hasExtension, getExtension} from './extensions';

export const [PLAUSIBLE_DATA_DOMAIN, PLAUSIBLE_SRC] = (() => {

  if (!hasExtension("plausibleDataDomain")) {
    return [undefined, undefined];
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn("Not using plausible analytics are we are in development mode");
    return [undefined, undefined];
  }

  return [getExtension("plausibleDataDomain"), 'https://plausible.io/js/script.js'];

})();
