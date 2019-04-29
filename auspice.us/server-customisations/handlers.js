const utils = require("../../cli/utils");

const error = (res, clientMsg, serverMsg="") => {
  res.statusMessage = clientMsg;
  utils.warn(`${clientMsg} -- ${serverMsg}`);
  return res.status(500).end();
};

module.exports = {
  getAvailable: (req, res) => {
    error(res, `Auspice.us currently doesn't have a listing of available datasets.`);
  },
  getDataset: (req, res) => {
    error(res, `Auspice.us currently doesn't serve datasets -- use drag & drop`);
  },
  getNarrative: (req, res) => {
    error(res, `Auspice.us currently doesn't handle narratives.`);
  },
};
