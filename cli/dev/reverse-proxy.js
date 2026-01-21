
const utils = require("../utils");
const { URL } = require("url");
const fetch = require("node-fetch");

const PROXY = process.env.PROXY || `http://localhost:5000`

utils.log(`[reverse-proxy] Will proxy charon API requests to ${PROXY}`)

const hopByHopHeaders = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

async function proxy(req, res) {
  // Charon API only supports GET
  if (req.method!=='GET') {
    res.statusCode = 501;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(`Request method not supported`);
    return;
  }

  const upstreamUrl = new URL(req.url, PROXY);
  utils.log(`[reverse-proxy] Proxying request "${req.url}" to upstream "${upstreamUrl.href}"`);

  const headers = { ...req.headers }
  for (const h of hopByHopHeaders) {
    delete headers[h]
  }
  headers.host = upstreamUrl.host; // Pretend this request was sent directly to the upstream

  const upstreamResp = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    headers,
    redirect: "manual",
    compress: false, // keep upstream compressed bytes
  });

  res.statusCode = upstreamResp.status;
  res.statusMessage = upstreamResp.statusText;

  // remove hop-by-hop headers
  upstreamResp.headers.forEach((value, key) => {
    if (hopByHopHeaders.includes(key.toLowerCase())) return;
    res.setHeader(key, value);
  });

  // Stream response body to client
  if (upstreamResp.body) {
    upstreamResp.body.pipe(res);
  } else {
    res.end();
  }
}

module.exports = {
  getAvailable: proxy,
  getDataset: proxy,
  getNarrative: proxy,
};