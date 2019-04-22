/* eslint no-console: off */
const fs = require("fs");
const convertFromV1 = require("./server/convertJsonSchemas").convertFromV1;
const utils = require("./utils");


const addParser = (parser) => {
  const description = `Convert dataset files to the most up-to-date schema`;

  const subparser = parser.addParser('convert', {addHelp: true, description});
  subparser.addArgument('--meta-json', {action: "store", help: "v1 schema metadata json"});
  subparser.addArgument('--tree-json', {action: "store", help: "v1 schema tree json"});
  subparser.addArgument('--output', {action: "store", help: "File to write output to"});
};


/**
 * this utility function will increase in scope over time
 * but currently it only converts v1 meta + tree jsons -> v2
 */
const run = (args) => {
  if (!(args.meta_json && args.tree_json)) {
    utils.error("Meta + Tree (v1) JSONs are required");
  }
  const meta = JSON.parse(fs.readFileSync(args.meta_json, 'utf8'));
  const tree = JSON.parse(fs.readFileSync(args.tree_json, 'utf8'));
  const v2 = convertFromV1({tree, meta});
  fs.writeFileSync(args.output, JSON.stringify(v2, null, 2));
};

module.exports = {
  addParser,
  run
};
