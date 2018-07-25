/* eslint no-console: off */

const fetch = require('node-fetch');
const fs = require('fs');

const fetchJSON = (path) => {
  const p = fetch(path)
    .then((res) => {
      if (res.status !== 200) throw new Error(res.statusText);
      const ctype = res.headers[Object.getOwnPropertySymbols(res.headers)[0]]["content-type"];
      const cenc = res.headers[Object.getOwnPropertySymbols(res.headers)[0]]["content-encoding"] || "none";
      console.log(`\tGot type ${ctype} with encoding ${cenc}`);
      return res;
    })
    .then((res) => res.json());
  return p;
};

const readFilePromise = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      try {
        return resolve(JSON.parse(data));
      } catch (parseErr) {
        return reject(parseErr);
      }
    });
  });
};

module.exports = {
  readFilePromise,
  fetchJSON
};
