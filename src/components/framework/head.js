import React from 'react';
import { connect } from "react-redux";
import { Helmet } from "react-helmet";
import { hasExtension, getExtension } from "../../util/extensions";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const Head = ({metadata, general}) => {
  let lang = general.language;

  let resources = {
    en: {
      language: "English",
      translation: {
        /* Sidebar */
        "Dataset": "Dataset",
        "Date Range": "Date Range",
        "Color By": "Color By",
        "Tree Options": "Tree Options",
        "Layout": "Layout",
        "rectangular": "rectangular",
        "radial": "radial",
        "unrooted": "unrooted",
        "clock": "clock",
        "Branch Length": "Branch Length",
        "time": "time",
        "divergence": "divergence",
        "Branch Labels": "Branch Labels",
        "Search Strains": "Search Strains",
        "Second Tree": "Second Tree",
        "Map Options": "Map Options",
        "Geographic resolution": "Geographic resolution",
        "Animation Speed": "Animation Speed",
        "Loop animation": "Loop animation",
        "Animate cumulative history": "Animate cumulative history",
        "Panel Options": "Panel Options",
        "Show tree": "Show tree",
        "Show map": "Show map",
        "Show entropy": "Show entropy",
        "Language": "Language",
        "Slow": "Slow",
        "Medium": "Medium",
        "Fast": "Fast",
        "full": "full",
        "grid": "grid",
      }
    },
    es: {
      language: "Español",
      translation: {
        "Dataset": "Conjunto de Datos",
        "Date Range": "Rango de Fechas",
        "Color By": "Colorear por",
        "Tree Options": "Opciones de Árbol",
        "Layout": "Diseño",
        "rectangular": "rectangular",
        "radial": "radial",
        "unrooted": "sin raíz",
        "clock": "reloj",
        "Branch Length": "Longitud de Rama",
        "time": "tiempo",
        "divergence": "divergencia",
        "Branch Labels": "Etiquetas de Rama",
        "Search Strains": "Buscar Cepas",
        "Second Tree": "Segundo Árbol",
        "Map Options": "Opciones de Mapa",
        "Geographic resolution": "Región geográfica",
        "Animation Speed": "Velocidad de animación",
        "Loop animation": "Repite la Animación",
        "Animate cumulative history": "Animar historial acumulativo",
        "Panel Options": "Opciones de panel",
        "Show tree": "Mostrar árbol",
        "Show map": "Mostrar mapa",
        "Show entropy": "Mostrar entropia",
        "Language": "La Idioma",
        "Slow": "Lento",
        "Medium": "Medio",
        "Fast": "Rápido",
        "full": "lleno",
        "grid": "bloques",
      } 
    },
  };

  i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: resources,
    lng: lang,
    fallbackLng: "en",
    debug: true,
    interpolation: {
      escapeValue: false
    },
  });

  let pageTitle = "auspice";
  if (hasExtension("browserTitle")) {
    pageTitle = getExtension("browserTitle");
  }
  const displayedDataset = window.location.pathname
    .replace(/^\//g, '')
    .replace(/\/$/g, '')
    .replace(/\//g, ' / ')
    .replace(/:/g, ' : ');
  if (displayedDataset) {
    pageTitle = pageTitle + " / " + displayedDataset;
  }
  return (
    <Helmet>
      <title>
        {pageTitle}
      </title>
      {metadata && metadata.title ?
        <meta name="description" content={metadata.title} /> :
        null}
    </Helmet>
  );
};

/* we want this component to rerun each time the pathname changes, which we keep a copy
of in state. This allows us to detect changes such as redirects such as /flu/avian ->
/flu/avian/h5n1/ha. Similarly when the metadata changes. */
export default connect(
  (state) => ({
    pathname: state.general.pathname,
    metadata: state.metadata,
    general: state.general
  })
)(Head);
