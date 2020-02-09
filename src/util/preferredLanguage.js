import { hasExtension, getExtension } from "./extensions";

export const getPreferredLanguage = hasExtension("getPreferredLanguage") ?
  getExtension("getPreferredLanguage")
  : () => {
  let browserLang = window.navigator.language.split("-")[0],
      narrativeLang = "",
      urlParts = window.location.pathname.toLowerCase().split("/");

  if (urlParts.length > 0 && urlParts[1] === "narratives") {
      narrativeLang = urlParts[urlParts.length - 2];
  }

  return narrativeLang || browserLang;
};
