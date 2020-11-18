/* eslint-disable import/first */

/* P O L Y F I L L S */
import "whatwg-fetch"; // eslint-disable-line
import "core-js";
import "regenerator-runtime";
import "css.escape";
/* L I B R A R I E S */
import "react-hot-loader";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
/* A U S P I C E   I M P O R T S */
import configureStore from "./store";
import { initialiseGoogleAnalyticsIfRequired } from "./util/googleAnalytics";
import Root from "./root";
/* I N T E R N A T I O N A L I Z A T I O N */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
/* S T Y L E S H E E T S */
import "./css/global.css";
import "./css/browserCompatability.css";
import "./css/bootstrapCustomized.css";
import "./css/static.css";
import "./css/notifications.css";
import "./css/select.css";

/* FONTS */
import 'typeface-lato'; // eslint-disable-line import/extensions

const store = configureStore();

/* set up non-redux state storage for the animation - use this conservitavely! */
if (!window.NEXTSTRAIN) {window.NEXTSTRAIN = {};}

/* google analytics */
initialiseGoogleAnalyticsIfRequired();

i18n
  .use(initReactI18next)
  .init({
    resources: {}, // eslint-disable-line
    lng: "en",
    fallbackLng: "en",
    /* To debug any errors w.r.t. i18n, swith the second `false` to `true`
    (and this can be kept even after deployment if needed) */
    debug: process.env.NODE_ENV === 'production' ? false : false, // eslint-disable-line
    interpolation: {
      escapeValue: false
    },
    defaultNS: 'translation'
  });

for (const ns of ["language", "sidebar", "translation"]) {
  import(/* webpackMode: "eager" */ `./locales/en/${ns}.json`)
    .then((res) => i18n.addResourceBundle("en", ns, res.default));
}

const renderApp = () => {
  ReactDOM.render(
    <Provider store={store}>
      <Root />
    </Provider>,
    document.getElementById('root')
  );
};

renderApp();

