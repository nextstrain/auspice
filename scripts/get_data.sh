rm -rf data/
mkdir -p data/

curl http://data.nextstrain.org/ebola_tree.json --compressed -o data/ebola_tree.json
curl http://data.nextstrain.org/ebola_sequences.json --compressed -o data/ebola_sequences.json
curl http://data.nextstrain.org/ebola_meta.json --compressed -o data/ebola_meta.json
curl http://data.nextstrain.org/ebola_entropy.json --compressed -o data/ebola_entropy.json

curl http://data.nextstrain.org/zika_tree.json --compressed -o data/zika_tree.json
curl http://data.nextstrain.org/zika_sequences.json --compressed -o data/zika_sequences.json
curl http://data.nextstrain.org/zika_meta.json --compressed -o data/zika_meta.json
curl http://data.nextstrain.org/zika_entropy.json --compressed -o data/zika_entropy.json

curl http://data.nextstrain.org/flu_tree.json --compressed -o data/flu_tree.json
curl http://data.nextstrain.org/flu_sequences.json --compressed -o data/flu_sequences.json
curl http://data.nextstrain.org/flu_meta.json --compressed -o data/flu_meta.json
curl http://data.nextstrain.org/flu_entropy.json --compressed -o data/flu_entropy.json

curl http://data.nextstrain.org/dengue_all_tree.json --compressed -o data/dengue_all_tree.json
curl http://data.nextstrain.org/dengue_all_sequences.json --compressed -o data/dengue_all_sequences.json
curl http://data.nextstrain.org/dengue_all_meta.json --compressed -o data/dengue_all_meta.json
curl http://data.nextstrain.org/dengue_all_entropy.json --compressed -o data/dengue_all_entropy.json
