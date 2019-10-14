/* eslint no-console: off */
const fs = require("fs");
const convertFromV1 = require("./server/convertJsonSchemas").convertFromV1;
const utils = require("./utils");


const addParser = (parser) => {
  const description = `Convert auspice dataset JSON file(s) to the most up-to-date schema (currently v2).
  Note that in auspice v2.x, "auspice view" will convert v1 JSONs to v2 for you (using the same logic as this command).
  `;

  const subparser = parser.addParser('convert', {addHelp: true, description});
  subparser.addArgument('--v1', {action: "store", nargs: 2, metavar: ["META", "TREE"], help: "v1 dataset JSONs"});
  subparser.addArgument('--output', {action: "store", metavar: "JSON", required: true, help: "File to write output to"});
  subparser.addArgument('--minify-json', {action: "storeTrue", help: "export JSONs without indentation or line returns"});
};


/**
 * this utility function will increase in scope over time
 * but currently it only converts v1 meta + tree jsons -> v2
 */
const run = (args) => {
  if (!args.v1) {
    utils.error("Currently v1 JSON inputs must be specified.");
  }
  if (!args.v1[0].endsWith("_meta.json") || !args.v1[1].endsWith("_tree.json")) {
    utils.error("v1 JSON inputs must be specified as *_meta.json and *_tree.json");
  }

  const v2 = convertFromV1({
    meta: JSON.parse(fs.readFileSync(args.v1[0], 'utf8')),
    tree: JSON.parse(fs.readFileSync(args.v1[1], 'utf8'))
  });
  fs.writeFileSync(args.output, JSON.stringify(v2, null, args.minify_json ? 0 : 2));
};

module.exports = {
  addParser,
  run
};
