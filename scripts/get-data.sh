#!/bin/bash
data_files=(
  "manifest_guest.json" \
  "dengue_all.json" "dengue_denv1.json" "dengue_denv2.json" "dengue_denv3.json" "dengue_denv4.json"\
  "ebola.json" \
  "ebola_2019-09-14-no-epi-id_meta.json" "ebola_2019-09-14-no-epi-id_tree.json" \
  "lassa_s_tree.json" "lassa_s_meta.json" \
  "lassa_l_tree.json" "lassa_l_meta.json" \
  "measles.json" \
  "mers_tree.json" "mers_meta.json" \
  "mumps_global.json" "mumps_na.json" \
  "WNV_NA_tree.json" "WNV_NA_meta.json" \
  "zika.json" \
  "flu_avian_h7n9_ha.json" \
  "flu_avian_h7n9_mp.json" \
  "flu_avian_h7n9_na.json" \
  "flu_avian_h7n9_np.json" \
  "flu_avian_h7n9_ns.json" \
  "flu_avian_h7n9_pa.json" \
  "flu_avian_h7n9_pb1.json" \
  "flu_avian_h7n9_pb2.json" \
  "flu_seasonal_h3n2_ha_2y.json" "flu_seasonal_h3n2_ha_2y_tip-frequencies.json" \
  "flu_seasonal_h3n2_ha_3y.json" "flu_seasonal_h3n2_ha_3y_tip-frequencies.json" \
  "flu_seasonal_h3n2_ha_6y.json" "flu_seasonal_h3n2_ha_6y_tip-frequencies.json" \
  "flu_seasonal_h3n2_ha_12y.json" "flu_seasonal_h3n2_ha_12y_tip-frequencies.json" \
  "flu_seasonal_h3n2_na_2y.json" "flu_seasonal_h3n2_na_2y_tip-frequencies.json" \
  "flu_seasonal_h3n2_na_3y.json" "flu_seasonal_h3n2_na_3y_tip-frequencies.json" \
  "flu_seasonal_h3n2_na_6y.json" "flu_seasonal_h3n2_na_6y_tip-frequencies.json" \
  "flu_seasonal_h3n2_na_12y.json" "flu_seasonal_h3n2_na_12y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_ha_2y.json" "flu_seasonal_h1n1pdm_ha_2y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_ha_3y.json" "flu_seasonal_h1n1pdm_ha_3y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_ha_6y.json" "flu_seasonal_h1n1pdm_ha_6y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_ha_12y.json" "flu_seasonal_h1n1pdm_ha_12y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_ha_pandemic_meta.json" "flu_seasonal_h1n1pdm_ha_pandemic_tree.json" "flu_seasonal_h1n1pdm_ha_pandemic_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_na_2y.json" "flu_seasonal_h1n1pdm_na_2y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_na_3y.json" "flu_seasonal_h1n1pdm_na_3y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_na_6y.json" "flu_seasonal_h1n1pdm_na_6y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_na_12y.json" "flu_seasonal_h1n1pdm_na_12y_tip-frequencies.json" \
  "flu_seasonal_h1n1pdm_na_pandemic_tree.json" "flu_seasonal_h1n1pdm_na_pandemic_meta.json" "flu_seasonal_h1n1pdm_na_pandemic_tip-frequencies.json" \
  "flu_seasonal_vic_ha_2y.json" "flu_seasonal_vic_ha_2y_tip-frequencies.json" \
  "flu_seasonal_vic_ha_3y.json" "flu_seasonal_vic_ha_3y_tip-frequencies.json" \
  "flu_seasonal_vic_ha_6y.json" "flu_seasonal_vic_ha_6y_tip-frequencies.json" \
  "flu_seasonal_vic_ha_12y.json" "flu_seasonal_vic_ha_12y_tip-frequencies.json" \
  "flu_seasonal_vic_na_2y.json" "flu_seasonal_vic_na_2y_tip-frequencies.json" \
  "flu_seasonal_vic_na_3y.json" "flu_seasonal_vic_na_3y_tip-frequencies.json" \
  "flu_seasonal_vic_na_6y.json" "flu_seasonal_vic_na_6y_tip-frequencies.json" \
  "flu_seasonal_vic_na_12y.json" "flu_seasonal_vic_na_12y_tip-frequencies.json" \
  "flu_seasonal_yam_ha_2y.json" "flu_seasonal_yam_ha_2y_tip-frequencies.json" \
  "flu_seasonal_yam_ha_3y.json" "flu_seasonal_yam_ha_3y_tip-frequencies.json" \
  "flu_seasonal_yam_ha_6y.json" "flu_seasonal_yam_ha_6y_tip-frequencies.json" \
  "flu_seasonal_yam_ha_12y.json" "flu_seasonal_yam_ha_12y_tip-frequencies.json" \
  "flu_seasonal_yam_na_2y.json" "flu_seasonal_yam_na_2y_tip-frequencies.json" \
  "flu_seasonal_yam_na_3y.json" "flu_seasonal_yam_na_3y_tip-frequencies.json" \
  "flu_seasonal_yam_na_6y.json" "flu_seasonal_yam_na_6y_tip-frequencies.json" \
  "flu_seasonal_yam_na_12y.json" "flu_seasonal_yam_na_12y_tip-frequencies.json" \
  "tb_global_meta.json" "tb_global_tree.json" \
  "enterovirus_d68_genome_meta.json" "enterovirus_d68_genome_tree.json" \
  "enterovirus_d68_vp1_meta.json" "enterovirus_d68_vp1_tree.json" \
  "ncov.json" "ncov_2020-01-25.json" "ncov_2020-01-23.json" \
  "ncov_2020-01-28.json" "ncov_2020-01-29.json" "ncov_2020-01-30.json" "ncov_2020-01-31.json" \
  "ncov_2020-02-02.json" "ncov_2020-02-03.json" "ncov_2020-02-04.json" "ncov_2020-02-05.json" \
  "ncov_2020-02-09.json" "ncov_2020-02-11.json" \
)

rm -rf data/
mkdir -p data/
for i in "${data_files[@]}"
do
  curl http://data.nextstrain.org/${i} --compressed -o data/${i}
done

echo "The local data directory ./data now contains up-to-date datasets from http://data.nextstrain.org"
