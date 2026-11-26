import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import languageBundle from "../locales/en/language.json";
import sidebarBundle from "../locales/en/sidebar.json";
import translationBundle from "../locales/en/translation.json";

/**
 * The standard app initialises i18next as a side effect of `src/index.js`. The
 * embed entry cannot rely on that having run, so this provides an idempotent
 * initialisation which bundles the English locale resources directly (rather
 * than fetching them asynchronously as the app does).
 */
let initialised = false;

export function ensureI18n(): typeof i18n {
  if (initialised || i18n.isInitialized) return i18n;

  i18n
    .use(initReactI18next)
    .init({
      resources: {},
      lng: "en",
      fallbackLng: "en",
      interpolation: {
        escapeValue: false
      },
      defaultNS: 'translation'
    });

  i18n.addResourceBundle("en", "language", languageBundle);
  i18n.addResourceBundle("en", "sidebar", sidebarBundle);
  i18n.addResourceBundle("en", "translation", translationBundle);

  initialised = true;
  return i18n;
}
