/* eslint no-console: off */
const fs = require('fs');
const path = require("path");
const fetch = require('node-fetch'); // not needed for local data
const request = require('request');
// const prettyjson = require('prettyjson');

const validUsers = ['guest', 'mumps'];

const getDataFile = (res, filePath, s3) => {
  if (global.LOCAL_DATA) {
    res.sendFile(path.join(global.LOCAL_DATA_PATH, filePath));
  } else if (s3 === "staging") {
    request(global.REMOTE_DATA_STAGING_BASEURL + filePath).pipe(res);
    /* TODO explore https://www.npmjs.com/package/cached-request */
  } else {
    // we deliberately don't ensure that s3===live, as this should be the default
    request(global.REMOTE_DATA_LIVE_BASEURL + filePath).pipe(res);
    /* TODO explore https://www.npmjs.com/package/cached-request */
  }
};

const getStaticFile = (res, filePath) => {
  if (global.LOCAL_STATIC) {
    res.sendFile(path.join(global.LOCAL_STATIC_PATH, filePath));
  } else {
    request(global.REMOTE_STATIC_BASEURL + filePath).pipe(res);
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
  getDataFile(res, 'manifest_' + query.user + '.json', query.s3);
};

const getPostsManifest = (query, res) => {
  getStaticFile(res, 'manifest.json');
};

const getSplashImage = (query, res) => {
  getDataFile(res, query.src, query.s3);
};

const getImage = (query, res) => {
  getStaticFile(res, query.src);
};

const getDatasetJson = (query, res) => {
  getDataFile(res, query.path, query.s3);
};

module.exports = {
  getManifest,
  getPostsManifest,
  getSplashImage,
  getImage,
  getDatasetJson
};
