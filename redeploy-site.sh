echo "Pinging Heroku Platform API to rebuild site"

curl -n -X POST https://api.heroku.com/apps/nextstrain-server/builds \
-d '{"source_blob":{"url":"https://github.com/nextstrain/nextstrain.org/archive/master.tar.gz"}}' \
-H 'Accept: application/vnd.heroku+json; version=3' \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $HEROKU_AUTH_TOKEN"
