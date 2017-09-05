/* eslint no-console: off */
const fs = require('fs');
const path = require("path");
// const prettyjson = require('prettyjson');

const validUsers = ['guest', 'mumps'];

const getManifest = (query, res) => {
  if (Object.keys(query).indexOf("user") === -1) {
    res.status(404).send('No user defined');
    return;
  }
  if (validUsers.indexOf(query.user) === -1) {
    res.status(404).send('Invalid user');
    return;
  }
  console.log("Manifest for \"" + query.user + "\" sent");
  res.sendFile(path.join(global.DATA_PREFIX, 'manifest_' + query.user + '.json'));
};

const getImage = (query, res) => {
  res.sendFile(path.join(global.DATA_PREFIX, query.src));
};

const getDatasetJson = (query, res) => {
  res.sendFile(path.join(global.DATA_PREFIX, query.path));
};

module.exports = {
  getManifest,
  getImage,
  getDatasetJson
};
