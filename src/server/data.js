/* eslint no-console: off */
const fs = require('fs');
const path = require("path");
const fetch = require('node-fetch'); // not needed for local data
const request = require('request');
// const prettyjson = require('prettyjson');

const s3 = "http://data.nextstrain.org/";
const validUsers = ['guest', 'mumps'];

const getFile = (res, filePath) => {
  if (global.LOCAL_DATA) {
    res.sendFile(path.join(global.LOCAL_DATA_PATH, filePath));
  } else {
    request(s3 + filePath).pipe(res);
    /* TODO explore https://www.npmjs.com/package/cached-request */
  }
};

// const fetchS3 = (res, filePath) => {
//   fetch(s3 + filePath)
//     .then((fetchRes) => fetchRes.json())
//     .then((json) => {
//       res.json(json);
//       // if (successMsg) {console.log(successMsg);}
//     })
//     .catch((err) => {
//       // if (errMsg) {console.error(errMsg);}
//       console.error(err);
//     });
// };

const getManifest = (query, res) => {
  if (Object.keys(query).indexOf("user") === -1) {
    res.status(404).send('No user defined');
    return;
  }
  if (validUsers.indexOf(query.user) === -1) {
    res.status(404).send('Invalid user');
    return;
  }
  getFile(res, 'manifest_' + query.user + '.json');
};

const getImage = (query, res) => {
  getFile(res, query.src);
};

const getDatasetJson = (query, res) => {
  getFile(res, query.path);
};

module.exports = {
  getManifest,
  getImage,
  getDatasetJson
};
