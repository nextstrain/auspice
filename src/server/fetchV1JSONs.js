const promises = require("./promises");


const fetchTreeAndMetaJSONs = (serverRes, source, path, toInject, errorHandler) => {

  const paths = [
    path.replace(".json", "_meta.json"),
    path.replace(".json", "_tree.json")
  ];

  const promise = source === "local" ? promises.readFilePromise : promises.fetchJSON;

  Promise.all([promise(paths[0]), promise(paths[1])])
    .then((jsons) => {
      const json = {
        meta: jsons[0],
        tree: jsons[1]
      };
      for (const field in toInject) { // eslint-disable-line
        json[field] = toInject[field];
      }
      console.log("\tSuccess fetching v1 JSONs. Sending as a single JSON.");
      serverRes.json(json);
    })
    .catch(errorHandler);
};


module.exports = {
  fetchTreeAndMetaJSONs
};
