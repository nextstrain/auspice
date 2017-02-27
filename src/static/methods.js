/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
// import Flex from "./framework/flex";
import TitleBar from "../components/framework/title-bar";

const Methods = () => {
  return (
		<g>
			<TitleBar dataNameHidden={true} methodsSelected={true}/>

			<div className="static container">



        <div className="row">
          <div className="col-md-1"/>
          <div className="col-md-7">
            <h1>Methods</h1>
            <h2>Overview</h2>
          </div>
        </div>

        <div className="row">

          <div className="col-md-1"/>
					<div className="col-md-6">

						The data processing for nextstrain consists of two stages: data collection (known as <a href="https://github.com/nextstrain/fauna">fauna</a>) and data processing (known as <a href="https://github.com/nextstrain/augur">augur</a>), each publicly available and detailed on github. Here we give an overview of these methods. The data vizualisation code is known as <a href="https://github.com/nextstrain/auspice">auspice</a>.

            <h2>Data Collection</h2>

						We maintain a database of publicly available sequences and have written a number of scripts to ingest and canonicize data from different sources. This database, which is regularly updated, allows downloading of all zika, ebola and influenza genomes in fasta format.

						<h2>Pruning and Alignment</h2>

						The first step in the processing pipeline is to automatically select a subset of representative viruses. This subsampling step is virus depended. For influenza virus, sequences without complete date or geographic information, viruses passaged in eggs and sequences less than 987 bases are removed. In addition, local outbreaks are filtered by keeping only one instance of identical sequences sampled at the same location on the same day. Following filtering, the viruses are subsampled to achieve a more equitable temporal and geographic distribution. For our standard display period of 3 years and 32 viruses per month, this typically results in ~1200 viruses. In the case of Zika or Ebola virus, substantial subsampling is not necessary and we mostly remove low quality sequences or duplicates.<br></br>

            Augur then aligns the selected sequences using <a href="http://mafft.cbrc.jp/alignment/software/">MAFFT</a>. Once aligned, the set of virus sequences is further cleaned by removing insertions relative to a reference sequence to	enforce canonical site numbering, by removing sequences that show either too much or too little divergence relative to the expectation given their sampling date, and by removing known reassortant clusters. As reference for each viral lineage, we chose a well characterized virus without defining the canonical amino-acid numbering.

						<h2>Tree Building</h2>

						From the filtered and cleaned alignment, <a href="https://github.com/nextstrain/augur">augur</a> builds a phylogenetic tree using <a href="http://www.microbesonline.org/fasttree/">FastTree</a>, which is then further refined using <a href="http://sco.h-its.org/exelixis/web/software/raxml/index.html">RAxML</a>. Next, augur uses <a href="https://github.com/neherlab/treetime">treetime</a> to infer a time tree based on the tree topology determined by RAxML and to infer nucleotide sequence and geographic location of every internal node of the tree. Missing sequence data at phylogeny tips is filled with the nearest ancestral sequence at these sites. The final tree is decorated with the attributes to be displayed in the browser.

          </div>

          <div className="col-md-1"/>

          <div className="col-md-3 aside">
            <img width="200" src={require("../images/nextstrain-components.png")}/>
          </div>

          <div className="col-md-1"/>

        </div>

				<div className="bigspacer"></div>

			</div>
		</g>
	);
};

// Methods.propTypes = {
//
// }

export default Methods;
