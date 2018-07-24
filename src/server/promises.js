const fetch = require('node-fetch');
const fs = require('fs');

const fetchJSON = (path) => {
  const p = fetch(path)
    .then((res) => {
      if (res.status !== 200) throw new Error(res.statusText);
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
