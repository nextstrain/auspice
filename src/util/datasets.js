export const dataURLStem = process.env.DATA_LOCAL ? "/data/" : "http://data.nextstrain.org/";

const seasonal = {
  segment: {
    ha: {
      "resolution": {
        "2y": "",
        "3y": "",
        "6y": "",
        "12y": "",
        default: "6y"
      }
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
    "flu": {
      "lineage": {
        "h7n9": {
          "segment": {
            "pb2": "c=division&r=division",
            "pb1": "c=division&r=division",
            "pa": "c=division&r=division",
            "ha": "c=division&r=division",
            "np": "c=division&r=division",
            "na": "c=division&r=division",
            "mp": "c=division&r=division",
            "ns": "c=division&r=division",
            "default": "ha"
          }
        },
        "h3n2": seasonal,
        "vic": seasonal,
        "yam": seasonal,
        "h1n1pdm": seasonal,
        "default": "h7n9"
      }
    },
    "default": "zika"
  }
};
