export const dataURLStem = process.env.DATA_LOCAL ? "/data/" : "http://data.nextstrain.org/";

const inits = {
  "flu": "c=region&r=country",
  "avian": "c=division&r=division"
};

const seasonal = {
  segment: {
    ha: {
      "resolution": {
        "2y": inits.flu, "3y": inits.flu, "6y": inits.flu, "12y": inits.flu, default: "6y"
      }
    },
    default: "ha"
  }
};
const seasonal_no2y = {
  segment: {
    ha: {
      "resolution": {"3y": inits.flu, "6y": inits.flu, "12y": inits.flu, default: "6y"}
    },
    default: "ha"
  }
};


export const datasets = {
  "pathogen": {
    "ebola": "c=division&r=division",
    "zika": "",
    "dengue": {
      "serotype": {
        "all": "",
        "denv1": "",
        "denv2": "",
        "denv3": "",
        "denv4": "",
        "default": "all"
      }
    },
    "avian": {
      "lineage": {
        "h7n9": {
          "segment": {
            "pb2": inits.avian, "pb1": inits.avian, "pa": inits.avian, "ha": inits.avian,
            "np": inits.avian, "na": inits.avian, "mp": inits.avian, "ns": inits.avian,
            "default": "ha"
          }
        },
        "default": "h7n9"
      }
    },
    "flu": {
      "lineage": {
        "h3n2": seasonal,
        "vic": seasonal_no2y,
        "yam": seasonal_no2y,
        "h1n1pdm": seasonal,
        "default": "h3n2"
      }
    },
    "default": "zika"
  }
};
