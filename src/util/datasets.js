export const dataURLStem = process.env.DATA_LOCAL ? "/data/" : "http://data.nextstrain.org/";

const inits = {
  "flu": "c=region&r=country&m=div",
  "avian": "c=division&r=division"
};

const seasonal = {
  segment: {
    ha: {
      "resolution": {"2y": inits.flu, "3y": inits.flu, "6y": inits.flu, "12y": inits.flu, default: "3y"}
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
        "h1n1pdm": seasonal,
        "vic": seasonal,
        "yam": seasonal,
        "default": "h3n2"
      }
    },
    "default": "zika"
  }
};
