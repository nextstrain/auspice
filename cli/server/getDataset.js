const getAvailable = require("./getAvailable");
const helpers = require("./getDatasetHelpers");

const setUpGetDatasetHandler = ({datasetsPath}) => {
  return async (req, res) => { // eslint-disable-line consistent-return
    try {
      const availableDatasets = await getAvailable.getAvailableDatasets(datasetsPath);
      const info = helpers.interpretRequest(req, datasetsPath);
      const redirected = helpers.redirectIfDatapathMatchFound(res, info, availableDatasets);
      if (redirected) return;
      helpers.makeFetchAddresses(info, datasetsPath, availableDatasets);
      await helpers.sendJson(res, info);
    } catch (err) {
      console.trace(err);
      // Throw 404 when not available
      const errorCode = err.message.endsWith("not in available datasets") ? 404 : 500;
      return helpers.handleError(res, `couldn't fetch JSONs`, err.message, errorCode);
    }
  };
};


module.exports = {
  setUpGetDatasetHandler
};
