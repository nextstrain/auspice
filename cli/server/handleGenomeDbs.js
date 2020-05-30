const fs = require('fs');
const path = require("path");
const through = require('through2');
const {PassThrough} = require('stream');
const Engine = require('nedb');
const fasta = require('bionode-fasta');
const bodyParser = require('body-parser');

const { promisify } = require('util');

const readdir = promisify(fs.readdir);

/*
  All NeDB database files are stored in the subdirectory 'genomeDbs'
  at the same level where fasta file and auspice file is located.
*/
const getDbPath = (fastaPath) => {
  const dbRoot = path.join(path.dirname(fastaPath), 'genomeDbs');
  const dbPath = path.join(dbRoot,
    path.basename(fastaPath).replace(".fasta", ".db"));
  return dbPath;
};

/*
  @param: ids: an array of fasta sequence ids
  @param: dbPath: resolvable path to NeDB database of genome sequences
*/
const fetchRecords = (ids, dbPath) =>
  new Promise((resolve, reject) => {
    console.log("dbPath: " + dbPath);
    const db = new Engine({filename: dbPath, autoload: true});
    if (db) {
      console.log("db connected");
      db.find({id: {$in: ids}}, (err, docs) => {
        if (err) {
          console.log('EE');
          reject(err);
        } else if (docs.length == 0) {
          console.log("No record found!");
          resolve(docs);
        } else {
          console.log("records: " + docs.length);
          resolve(docs);
        }
      });
    }
  });


/**
   return response to a POST of fetching genome sequences by an array of ids
   @param {string} datasetPath same as datasetDir when staring auspice
*/
const getGenomeDB = (datasetsPath) => {
  return async (req, res) => { // eslint-disable-line consistent-return
    try {
      let prefix = req.body.prefix
          .replace(/^\//, '')
          .replace(/\/$/, '')
          .split("/")
          .join("_");
      const dbPath = datasetsPath + '/genomeDbs/' + prefix + '.db';
      if (!req.body.ids || req.body.ids.length === 0) {
        res.setHeader('Content-Type', 'application/json');
        if (fs.existsSync(dbPath)) {
          res.end(JSON.stringify({result: true}));
        } else {
          res.end(JSON.stringify({result: false}));
        }
        return;
      }
      res.setHeader('Content-Type', 'text/plain');
      var db = await fetchRecords(req.body.ids, dbPath);
      db.forEach(v=> {
        const wrappedSeq = v.seq.match(/.{1,80}/g).join('\n') + '\n';
        res.write('>' + v.id + '\n');
        res.write(wrappedSeq);
      });
      res.end();
    } catch (err) {
      console.trace(err);
    }
  };
};

/**
   @param {string} path Path to datasetDir so we can create database if corresponding fasta
   files exists for aupsice input JSON file
*/
const prepareDbs = async (path) => {
  try {
    const files = await readdir(path);
    const v2Files = files.filter((file) => (
      file.endsWith(".fasta")
    ));
    v2Files.forEach((v) => {
      makeDB(path, path + '/' + v);
    });


  } catch (err) {
    // utils.warn(`Couldn't collect available dataset files (path searched: ${path})`);
    // utils.verbose(err);
  }
};

/**
   @param {string} dbRoot Path to directory where genome database should be saved
   @param {string} fastaPath Path to fasta file to use as input to create database

   Database will overwrite existing database files to avoid duplicates.
   TODO: Maybe do something else to prevent unexpected data loss
*/
const makeDB = (dbRoot, fastaPath) => new Promise((resolve, reject) => {

  process.stdin.setEncoding('utf8');

  if (!fs.existsSync(dbRoot)) {
    fs.mkdirSync(dbRoot);
  }
  const dbPath = getDbPath(fastaPath);

  if (fs.existsSync(dbPath)) {
    fs.unlink(dbPath, () => { console.log(`Overwrote ${dbPath} with new data!`);});
  }

  const processRecord = new PassThrough();
  const db = new Engine({filename: dbPath, autoload: true});
  let rc = 0;

  processRecord.on('data', (rec) => {
    obj = JSON.parse(rec);
    const outrec = {id: obj.id, seq: obj.seq, source: fastaPath};
    db.insert(outrec);
    rc++;
  });

  processRecord.on('end', () => {
    console.log(`Total added: ${rc} seqs to ${dbPath}`);
    if (fs.existsSync(dbPath)) {
      resolve();
    } else {
      reject(`File: ${dbPath} was not created.`);
    }
  }
  );
  const rs = fs.createReadStream(fastaPath);
  rs.pipe(fasta())
    .pipe(processRecord);

});
module.exports = {
  fetchRecords,
  getDbPath,
  makeDB,
  prepareDbs,
  getGenomeDB
};
