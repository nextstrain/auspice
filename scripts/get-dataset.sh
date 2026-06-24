#!/usr/bin/env bash
# A simple, non-battle-hardened, script to help downloading a dataset
# and corresponding sidecars for testing locally with auspice.
#
# Examples:
# ./scripts/get-dataset.sh nextstrain.org/zika data
# ./scripts/get-dataset.sh nextstrain.org/community/joverlee521/nextstrain-testing/flu/seasonal/h1n1pdm/ha/09-17 datasets
echo "Getting dataset + sidecars associated with $1 and downloading them to $2"

if [ ! -d "${2}" ]; then
  echo "Directory ${2} doesn't exist!";
  exit 2;
fi

dataset_suffix=${1#*nextstrain.org/}
dataset_underscores=${dataset_suffix//\//_}
dest="${2%/}/${dataset_underscores}.json"

main="https://nextstrain.org/charon/getDataset?prefix=${dataset_suffix}"
if [[ $( curl -iI -sw "%{http_code}" "${main}" -o /dev/null ) == 200 ]]; then
  curl "${main}" --compressed --output "${dest}"
  echo Downloaded main JSON to "${dest}"
else
  echo "Cannot download main JSON. Fatal!"
  exit 3
fi

sidecar="tip-frequencies"
if [[ $( curl -iI -sw "%{http_code}" "${main}&type=${sidecar}" -o /dev/null ) == 200 ]]; then
  curl "${main}&type=${sidecar}" --compressed --output "${dest%.json}_${sidecar}.json"
  echo Downloaded ${sidecar} JSON to "${dest%.json}_${sidecar}.json"
else
  echo "Cannot download ${sidecar} JSON. Continuing..."
fi

sidecar="root-sequence"
if [[ $( curl -iI -sw "%{http_code}" "${main}&type=${sidecar}" -o /dev/null ) == 200 ]]; then
  curl "${main}&type=${sidecar}" --compressed --output "${dest%.json}_${sidecar}.json"
  echo Downloaded ${sidecar} JSON to "${dest%.json}_${sidecar}.json"
else
  echo "Cannot download ${sidecar} JSON. Continuing..."
fi

sidecar="measurements"
if [[ $( curl -iI -sw "%{http_code}" "${main}&type=${sidecar}" -o /dev/null ) == 200 ]]; then
  curl "${main}&type=${sidecar}" --compressed --output "${dest%.json}_${sidecar}.json"
  echo Downloaded ${sidecar} JSON to "${dest%.json}_${sidecar}.json"
else
  echo "Cannot download ${sidecar} JSON. Continuing..."
fi