#!/bin/bash

echo "Pinging Travis CI to rebuild Docker image"

body='{
  "request": {
    "branch": "master",
    "message": "Build triggered from auspice"
  }
}'

curl -X POST https://api.travis-ci.com/repo/nextstrain%2Fdocker-base/requests \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Travis-API-Version: 3" \
  -H "Authorization: token $TRAVIS_AUTH_TOKEN" \
  -d "$body"
