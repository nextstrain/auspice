const _ = require('lodash');
const { default: fetch, Headers } = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');

const utils = require('../utils');

const TILES_CACHE_DIR = 'cache/tiles';


function areValidCoordinates(coord) {
  return _.every(coord, (c) => _.isInteger(_.toNumber(c)));
}

/**
 * Caches map tiles requested by the client, so that previously seen tiles are
 * available from localhost.
 */
class TileCache {
  constructor() {
    // TODO: setup transpiling server code to avoid .bind(this) and for other syntactic perks
    this.requestHandler = this.requestHandler.bind(this);
    this.getTile = this.getTile.bind(this);
  }

  /**
   * Handles network requests
   */
  async requestHandler(req, res) {
    if (!this.validateParams(req, res)) {
      return res.status(400)
        .type('json')
        .send({ error: 'Bad request' });
    }

    // Send tile
    const { s, x, y, z } = req.params;
    try {
      const image = await this.getTile({ s, x, y, z, headers: req.headers });

      if (!image) {
        return res.sendStatus(404);
      }

      // TODO: better performance we may implement streaming response
      return res.type('png')
        .send(image);


    } catch (error) {
      const details = error.message || 'unknown';
      utils.error(`TileCache.requestHandler: ${details}`);
      return res.status(500)
        .type('json')
        .send({ error: `server error: ${details}` });
    }
  }

  validateParams(req) {
    const { s, x, y, z } = req.params;

    // Check `s` param
    if (!_.isString(s) || s.length === 0) {
      utils.error(`TileCache.requestHandler: s to be a non-empty string, got "${s}"`);
      return false;
    }

    // Check `x, y, z` params
    if (!(areValidCoordinates({ x, y, z }))) {
      utils.error(`TileCache.requestHandler: { x, y, z } expected to be integral coordinates, got {"${x}", "${y}","${z}"}`);
      return false;
    }

    return true;
  }

  async getTile({ s, x, y, z, headers }) {
    const localPath = path.join(TILES_CACHE_DIR, `${s}-${z}-${x}-${y}.png`);
    const remoteUrl = `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;

    // If cache file for this tile exists, then read it and return
    if ((await fs.exists(localPath)) && (await fs.stat(localPath)).isFile()) {
      const image = fs.readFile(localPath);
      utils.verbose(`Returning cached tile: ${remoteUrl}`);
      return image;
    }

    // No cached tile? Request tile from the remote server, then cache it
    utils.verbose(`Fetching tile: ${remoteUrl}`);
    try {
      const response = await fetch(remoteUrl, {
        headers: new Headers({
          Accept: 'image/png',

          // Pass user-agent through from client.
          // TODO: check with openstreetmap docs whether it's valid.
          'User-Agent': headers['user-agent'] || headers['User-Agent']
        })
      });

      if (response.status === 200) {
        const image = await response.buffer();

        utils.verbose(`Caching tile: ${remoteUrl} -> ${localPath}`);

        // We don't wait for caching to complete.
        // TODO: ensure that we don't serve incomplete files
        //  (e.g. keep track of completely cached tiles)
        fs.ensureDir(path.dirname(localPath))
          .then(() => {
            fs.writeFile(localPath, image);
          });

        utils.verbose(`Returning remote tile: ${remoteUrl}`);
        return image;
      }
    } catch (e) {
      //  TODO: We want to allow server to continue functioning even if network
      //   is down and tiles cannot be fetched, however some of the errors might
      //   still require handling.
    }

    // TODO: In case where there is no cached tile and tile cannot be fetched
    //  remotely we currently send 404.
    // Alternatively, we could send an empty png image 256x256 pixels:
    // const image = fs.readFile(path.join(__dirname, '..', '..', 'src/images/empty-map-tile.png'));
    // utils.verbose(`Returning empty tile instead of ${remoteUrl}`);
    // return image;
    return null;
  }
}

module.exports = TileCache;
