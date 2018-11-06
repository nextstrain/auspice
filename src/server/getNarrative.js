// const utils = require("./utils");
const queryString = require("query-string");
const sourceSelect = require("./sourceSelect");
const narratives = require('./narratives');

const getNarrative = (req, res) => {
  const prefix = queryString.parse(req.url.split('?')[1]).prefix || "";
  const source = sourceSelect.getSource(prefix);
  narratives.serveNarrative(source, prefix, res);
};

module.exports = {
  getNarrative,
  default: getNarrative
};
