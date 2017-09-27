rm -rf data/
mkdir -p data/

data_files=( "manifest_guest.json" "manifest_mumps.json"
  "ebola_tree.json" "ebola_sequences.json" "ebola_meta.json" "ebola_entropy.json"\
  "zika_tree.json" "zika_sequences.json" "zika_meta.json" "zika_entropy.json"\
  "flu_h3n2_ha_3y_tree.json" "flu_h3n2_ha_3y_sequences.json" "flu_h3n2_ha_3y_meta.json" "flu_h3n2_ha_3y_entropy.json"\
  "flu_h3n2_ha_6y_tree.json" "flu_h3n2_ha_6y_sequences.json" "flu_h3n2_ha_6y_meta.json" "flu_h3n2_ha_6y_entropy.json"\
  "flu_h3n2_ha_12y_tree.json" "flu_h3n2_ha_12y_sequences.json" "flu_h3n2_ha_12y_meta.json" "flu_h3n2_ha_12y_entropy.json"\
  "flu_h1n1pdm_ha_3y_tree.json" "flu_h1n1pdm_ha_3y_sequences.json" "flu_h1n1pdm_ha_3y_meta.json" "flu_h1n1pdm_ha_3y_entropy.json"\
  "flu_h1n1pdm_ha_6y_tree.json" "flu_h1n1pdm_ha_6y_sequences.json" "flu_h1n1pdm_ha_6y_meta.json" "flu_h1n1pdm_ha_6y_entropy.json"\
  "flu_h1n1pdm_ha_12y_tree.json" "flu_h1n1pdm_ha_12y_sequences.json" "flu_h1n1pdm_ha_12y_meta.json" "flu_h1n1pdm_ha_12y_entropy.json"\
  "flu_vic_ha_3y_tree.json" "flu_vic_ha_3y_sequences.json" "flu_vic_ha_3y_meta.json" "flu_vic_ha_3y_entropy.json"\
  "flu_vic_ha_6y_tree.json" "flu_vic_ha_6y_sequences.json" "flu_vic_ha_6y_meta.json" "flu_vic_ha_6y_entropy.json"\
  "flu_vic_ha_12y_tree.json" "flu_vic_ha_12y_sequences.json" "flu_vic_ha_12y_meta.json" "flu_vic_ha_12y_entropy.json"\
  "flu_yam_ha_3y_tree.json" "flu_yam_ha_3y_sequences.json" "flu_yam_ha_3y_meta.json" "flu_yam_ha_3y_entropy.json"\
  "flu_yam_ha_6y_tree.json" "flu_yam_ha_6y_sequences.json" "flu_yam_ha_6y_meta.json" "flu_yam_ha_6y_entropy.json"\
  "flu_yam_ha_12y_tree.json" "flu_yam_ha_12y_sequences.json" "flu_yam_ha_12y_meta.json" "flu_yam_ha_12y_entropy.json"\
  "avian_h7n9_ha_tree.json" "avian_h7n9_ha_sequences.json" "avian_h7n9_ha_meta.json" "avian_h7n9_ha_entropy.json"\
  "avian_h7n9_mp_tree.json" "avian_h7n9_mp_sequences.json" "avian_h7n9_mp_meta.json" "avian_h7n9_mp_entropy.json"\
  "avian_h7n9_na_tree.json" "avian_h7n9_na_sequences.json" "avian_h7n9_na_meta.json" "avian_h7n9_na_entropy.json"\
  "avian_h7n9_np_tree.json" "avian_h7n9_np_sequences.json" "avian_h7n9_np_meta.json" "avian_h7n9_np_entropy.json"\
  "avian_h7n9_ns_tree.json" "avian_h7n9_ns_sequences.json" "avian_h7n9_ns_meta.json" "avian_h7n9_ns_entropy.json"\
  "avian_h7n9_pa_tree.json" "avian_h7n9_pa_sequences.json" "avian_h7n9_pa_meta.json" "avian_h7n9_pa_entropy.json"\
  "avian_h7n9_pb1_tree.json" "avian_h7n9_pb1_sequences.json" "avian_h7n9_pb1_meta.json" "avian_h7n9_pb1_entropy.json"\
  "avian_h7n9_pb2_tree.json" "avian_h7n9_pb2_sequences.json" "avian_h7n9_pb2_meta.json" "avian_h7n9_pb2_entropy.json"\
  "dengue_all_tree.json" "dengue_all_sequences.json" "dengue_all_meta.json" "dengue_all_entropy.json"\
  "dengue_denv1_tree.json" "dengue_denv1_sequences.json" "dengue_denv1_meta.json" "dengue_denv1_entropy.json"\
  "dengue_denv2_tree.json" "dengue_denv2_sequences.json" "dengue_denv2_meta.json" "dengue_denv2_entropy.json"\
  "dengue_denv3_tree.json" "dengue_denv3_sequences.json" "dengue_denv3_meta.json" "dengue_denv3_entropy.json"\
  "dengue_denv4_tree.json" "dengue_denv4_sequences.json" "dengue_denv4_meta.json" "dengue_denv4_entropy.json"\
  "mumps_global_tree.json" "mumps_global_sequences.json" "mumps_global_meta.json" "mumps_global_entropy.json"\
  "mumps_bc_tree.json" "mumps_bc_sequences.json" "mumps_bc_meta.json" "mumps_bc_entropy.json"\
  "mumps_mass_tree.json" "mumps_mass_sequences.json" "mumps_mass_meta.json" "mumps_mass_entropy.json"\
)

static_files=(
  "img_mumps.jpg"\
  "img_dengue.png"\
  "img_avianinfluenza.png"\
  "img_seasonalinfluenza.png"\
  "img_ebola.png"\
  "img_zika.png"\  
  "figures_feb-2016_h1n1pdm_6b2_tree.png"\
  "figures_feb-2016_h1n1pdm_clades.png"\
  "figures_feb-2016_h1n1pdm_counts.png"\
  "figures_feb-2016_h1n1pdm_hi.png"\
  "figures_feb-2016_h1n1pdm_mutations.png"\
  "figures_feb-2016_h1n1pdm_tree.png"\
  "figures_feb-2016_h3n2_3c2a_lbi.png"\
  "figures_feb-2016_h3n2_3c2a_tree.png"\
  "figures_feb-2016_h3n2_basal_viruses.png"\
  "figures_feb-2016_h3n2_clades.png"\
  "figures_feb-2016_h3n2_counts.png"\
  "figures_feb-2016_h3n2_hi.png"\
  "figures_feb-2016_h3n2_mutations.png"\
  "figures_feb-2016_vic_counts.png"\
  "figures_feb-2016_vic_mutations.png"\
  "figures_feb-2016_yam_clades.png"\
  "figures_feb-2016_yam_counts.png"\
  "figures_feb-2016_yam_mutations.png"\
  "figures_feb-2017_h1n1pdm_clades.png"\
  "figures_feb-2017_h1n1pdm_counts.png"\
  "figures_feb-2017_h1n1pdm_frequencies.png"\
  "figures_feb-2017_h1n1pdm_mutations.png"\
  "figures_feb-2017_h1n1pdm_tree.png"\
  "figures_feb-2017_h1n1pdm_tree.svg"\
  "figures_feb-2017_h3n2_clades.png"\
  "figures_feb-2017_h3n2_counts.png"\
  "figures_feb-2017_h3n2_frequencies.png"\
  "figures_feb-2017_h3n2_lbi.png"\
  "figures_feb-2017_h3n2_mutations.png"\
  "figures_feb-2017_h3n2_tree.png"\
  "figures_feb-2017_h3n2_tree.svg"\
  "figures_feb-2017_h3n2_tree_titer_model.png"\
  "figures_feb-2017_h3n2_tree_titer_model.svg"\
  "figures_feb-2017_vic_counts.png"\
  "figures_feb-2017_vic_frequencies.png"\
  "figures_feb-2017_vic_lbi.png"\
  "figures_feb-2017_vic_lbi.svg"\
  "figures_feb-2017_vic_mutations.png"\
  "figures_feb-2017_yam_clades.png"\
  "figures_feb-2017_yam_counts.png"\
  "figures_feb-2017_yam_frequencies.png"\
  "figures_feb-2017_yam_lbi.png"\
  "figures_feb-2017_yam_mutations.png"\
  "figures_feb-2017_yam_tree.png"\
  "figures_feb-2017_yam_tree.svg"\
  "figures_sep-2015_h1n1pdm_geo.png"\
  "figures_sep-2015_h1n1pdm_ha1-84_ha1-164_frequencies.png"\
  "figures_sep-2015_h1n1pdm_ha2-164_ha1-84.png"\
  "figures_sep-2015_h3n2_dates.png"\
  "figures_sep-2015_h3n2_frequencies.png"\
  "figures_sep-2015_h3n2_ha1-159.png"\
  "figures_sep-2015_h3n2_ha1-159_frequencies.png"\
  "figures_sep-2015_h3n2_hi_titers.png"\
  "figures_sep-2015_h3n2_hi_titers_ce.png"\
  "figures_sep-2015_h3n2_lbi.png"\
  "figures_sep-2015_vic_frequencies.png"\
  "figures_sep-2015_vic_ha1-129_ha1-209.png"\
  "figures_sep-2015_yam_ha1-172.png"\
  "figures_sep-2015_yam_ha1-172_frequencies.png"\
  "figures_sep-2015_yam_ha1-251.png"\
  "figures_sep-2015_yam_ha1-251_frequencies.png"\
  "figures_sep-2016_h1n1pdm_clades.png"\
  "figures_sep-2016_h1n1pdm_counts.png"\
  "figures_sep-2016_h1n1pdm_hi.png"\
  "figures_sep-2016_h1n1pdm_lbi.png"\
  "figures_sep-2016_h1n1pdm_mutations.png"\
  "figures_sep-2016_h1n1pdm_tree.png"\
  "figures_sep-2016_h3n2_171k_basal.png"\
  "figures_sep-2016_h3n2_3c2a_tree.png"\
  "figures_sep-2016_h3n2_3c3a_rbs_mutations.png"\
  "figures_sep-2016_h3n2_3c3a_tree.png"\
  "figures_sep-2016_h3n2_clades.png"\
  "figures_sep-2016_h3n2_clades_all.png"\
  "figures_sep-2016_h3n2_counts.png"\
  "figures_sep-2016_h3n2_counts_all.png"\
  "figures_sep-2016_h3n2_historical_tree_na.png"\
  "figures_sep-2016_h3n2_lbi.png"\
  "figures_sep-2016_h3n2_mutations.png"\
  "figures_sep-2016_h3n2_mutations_all.png"\
  "figures_sep-2016_vic_counts.png"\
  "figures_sep-2016_vic_lbi.png"\
  "figures_sep-2016_vic_mutations.png"\
  "figures_sep-2016_yam_clades.png"\
  "figures_sep-2016_yam_counts.png"\
  "figures_sep-2016_yam_mutations.png"\
  "figures_sep-2016_yam_tree.png"\
  "post_2015-09-16-sep-2015.md"\
  "post_2016-02-18-feb-2016.md"\
  "post_2016-09-21-sep-2016.md"\
  "post_2017-02-23-feb-2017.md"\
  )

for i in "${data_files[@]}"
do
  curl http://data.nextstrain.org/${i} --compressed -o data/${i}
done

for i in "${static_files[@]}"
do
  curl http://cdn.rawgit.com/nextstrain/themis/master/files/${i} --compressed -o static/${i}
done
