/* eslint no-console: off */
const fs = require("fs");
const convertFromV1 = require("./server/convertJsonSchemas").convertFromV1;
const utils = require("./utils");


const addParser = (parser) => {
  const description = `Convert dataset JSON file(s) to the most up-to-date schema`;

  const subparser = parser.addParser('convert', {addHelp: true, description});
  subparser.addArgument(
    '--input',
    {action: "store", nargs: '+', help: "dataset JSON. If v1, then provide both meta & tree JONS, in that order"}
  );
  subparser.addArgument('--output', {action: "store", help: "File to write output to"});

  subparser.addArgument('--minify-json', {action: "storeTrue", help: "export JSONs without indentation or line returns"});
};


/**
 * this utility function will increase in scope over time
 * but currently it only converts v1 meta + tree jsons -> v2
 */
const run = (args) => {

  if (args.input.length !== 2 || !args.input[0].endsWith("_meta.json") || !args.input[1].endsWith("_tree.json")) {
    utils.error("Currently only v1 (meta + tree) JSONs are supported as valid input, and they must be in that order.");
  }

  const meta = JSON.parse(fs.readFileSync(args.input[0], 'utf8'));
  const tree = JSON.parse(fs.readFileSync(args.input[1], 'utf8'));
  const v2 = convertFromV1({tree, meta});
  fs.writeFileSync(args.output, JSON.stringify(v2, null, args.minify_json ? 0 : 2));
};

module.exports = {
  addParser,
  run
};
