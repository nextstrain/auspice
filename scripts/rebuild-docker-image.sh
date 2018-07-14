echo "Pinging Docker Hub to rebuild image"

curl -n -X POST https://registry.hub.docker.com/u/nextstrain/base/trigger/$DOCKER_AUTH_TOKEN/ \
--data '{"build": true}' \
-H "Content-Type: application/json"
