import React from "react";
import { connect } from "react-redux";
import i18n from "i18next";

import { controlsWidth } from "../../util/globals";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { CHANGE_LANGUAGE } from "../../actions/types";
import CustomSelect from "./customSelect";

@connect((state) => {
  return {
    metadata: state.metadata,
    language: state.general.language
  };
})
class Language extends React.Component {
  async ensureLanguageResources(lang) {
    for (const ns of ["language", "sidebar", "translation"]) {
      if (!i18n.hasResourceBundle(lang, ns)) {
        try {
          const res = await import(/* webpackMode: "lazy-once" */ `../../locales/${lang}/${ns}.json`);
          i18n.addResourceBundle(lang, ns, res.default);
        } catch (err) {
          console.error(`Language ${lang} not found!`);
        }
      }
    }
  }

  async UNSAFE_componentWillMount() {
    if (!this.props.language || this.props.language === "en") return;
    await this.ensureLanguageResources(this.props.language);
    i18n.changeLanguage(this.props.language);
  }

  getlanguageOptions() {
    const languages = [
      {value: "de", label: "Deutsch"},
      {value: "en", label: "English"},
      {value: "es", label: "Español"},
      {value: "ru", label: "Русский"},
      {value: "lt", label: "Lietuvių"},
      {value: "pt", label: "Português"},
      {value: "fr", label: "Français"},
      {value: "tr", label: "Türkçe"},
      {value: "ja", label: "日本語"},
      {value: "ar", label: "العربية"},
      {value: "it", label: "Italiano"},
      {value: "pl", label: "Polski"}
    ];
    return languages;
  }

  async changeLanguage(language) {
    if (!language || language === this.props.language) return;
    analyticsControlsEvent("change-language");
    await this.ensureLanguageResources(language);
    i18n.changeLanguage(language);
    this.props.dispatch({ type: CHANGE_LANGUAGE, data: language });
  }

  render() {
    const selectOptions = this.getlanguageOptions();
    return (
      <div style={{paddingBottom: 100, width: controlsWidth, fontSize: 14}}>
        <CustomSelect
          name="selectLanguage"
          id="selectLanguage"
          value={selectOptions.filter(({value}) => value === this.props.language)}
          options={selectOptions}
          isClearable={false}
          isSearchable={false}
          isMulti={false}
          onChange={(opt) => {this.changeLanguage(opt.value);}}
        />
      </div>
    );
  }
}

export default Language;
