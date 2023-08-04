#!/bin/bash

data_files=(
  "entropy-test-data_hepB.json" \
  "entropy-test-data_ncov.json" \
  "zika.json" \
  "monkeypox.json" \
)

rm -rf data/
mkdir -p data/
for i in "${data_files[@]}"
do
  curl http://staging.nextstrain.org/"${i}" --compressed -o data/"${i}"
done


echo "The local data directory ./data now contains a selection of up-to-date datasets from http://data.nextstrain.org"
