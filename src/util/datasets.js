export const dataURLStem = process.env.DATA_LOCAL ? "/data/" : "http://data.nextstrain.org/";

const init = "c=region&r=country";

const seasonal = {
  segment: {
    ha: {
      "resolution": {"2y": init, "3y": init, "6y": init, "12y": init, default: "6y"}
    },
    default: "ha"
  }
};
const seasonal_no2y = {
  segment: {
    ha: {
      "resolution": {"3y": init, "6y": init, "12y": init, default: "6y"}
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
        "vic": seasonal_no2y,
        "yam": seasonal_no2y,
        "h1n1pdm": seasonal,
        "default": "h7n9"
      }
    },
    "default": "zika"
  }
};
