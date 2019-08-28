/** This file exports the functions / objects available to node packages
 * which import auspice (e.g. via `const auspice = require("auspice")`)
 *
 * These are intended to be "helper functions" for those wishing to write
 * their own auspice server, i.e. a server which handles the GET
 * requests originating from a auspice client.
 */


const convertFromV1 = require("./cli/server/convertJsonSchemas").convertFromV1;
const parseNarrativeFile = require("./cli/server/parseNarrative").default;

module.exports = {
  convertFromV1,
  parseNarrativeFile
};
