/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
// import { connect } from "react-redux";
import Flex from "../components/framework/flex";
import TitleBar from "../components/framework/title-bar";
import { analyticsNewPage } from "../util/googleAnalytics";
import { version } from "../version";
import { Link } from "react-router-dom";

/* helper / generating functions */
const generateLogos = [
  <a key={1} href="http://www.fredhutch.org/" target="_blank">
    <img width="75" src={require("../images/fred-hutch-logo-small.png")}/>
  </a>,
  <a key={2} href="http://www.eb.tuebingen.mpg.de/" target="_blank">
    <img width="65" src={require("../images/max-planck-logo-small.png")}/>
  </a>,
  <a key={3} href="https://www.nih.gov/" target="_blank">
    <img width="52" src={require("../images/nih-logo-small.png")}/>
  </a>,
  <a key={4} href="https://erc.europa.eu/" target="_blank">
    <img width="60" src={require("../images/erc-logo-small.png")}/>
  </a>,
  <a key={5} href="https://www.openscienceprize.org/" target="_blank">
    <img width="82" src={require("../images/osp-logo-small.png")}/>
  </a>,
  <a key={6} href="http://biozentrum.org/" target="_blank">
    <img width="85" src={require("../images/bz_logo.png")}/>
  </a>
];

const About = () => {
  analyticsNewPage();
  return(
    <g>
      <TitleBar dataNameHidden={true} aboutSelected={true}/>

			<div className="static container">

        <div className="row">
					<div className="col-md-1"/>
					<div className="col-md-7">
            <h1>About</h1>
            <h2>Viral Phylogenies</h2>
          </div>
        </div>

        <div className="row">

          <div className="col-md-1"/>
					<div className="col-md-6">

            In the course of an infection and over an epidemic, viral pathogens naturally accumulate random mutations to their genomes. This is an inevitable consequence of error-prone viral replication. Since different viruses typically pick up different mutations, mutations can be used as a marker of transmission in which closely related viral genomes indicate closely related infections. By reconstructing a viral "phylogeny" we can learn about important epidemiological phenomena such as spatial spread, introduction timings and epidemic growth rate.

						<h2>Actionable Inferences</h2>

            However, if viral genome sequences are going to inform public health interventions, then analyses have to be rapidly conducted and results widely disseminated. Current scientific publishing practices hinder the rapid dissemination of epidemiologically relevant results. We thought an open online system that implements robust bioinformatic pipelines to synthesize data from across research groups has the best capacity to make epidemiologically actionable inferences.

            <h2>This Website</h2>

            This website aims to provide a <i>real-time</i> snapshot of evolving viral populations and to provide interactive data visualizations to virologists, epidemiologists, public health officials and citizen scientists. Through interactive data visualizations, we aim to allow exploration of continually up-to-date datasets, providing a novel surveillance tool to the scientific and public health communities.

            <h2>Current Datasets</h2>

            <p/><Link to="/ebola">Ebola Virus</Link><p/>

            The 2013-2016 Ebola outbreak caused worldwide alarm and over 10,000 fatalities in West Africa. Nextstrain allows exploration of the phylogeny of over 2000 genomes, complete with temporal and geographic data and inferred transmission events. For a review into how genomic sequencing helped understand this outbreak see <a href="http://www.nature.com/nature/journal/v538/n7624/full/nature19790.html">Holmes <i>et al.</i></a>

            <p/><Link to="/zika">Zika Virus</Link><p/>

            The ongoing (2015-) epidemic of zika fever in the Americas is seen here in the context of over 400 genomes including isolates from Asia and the Pacific Islands. Multiple trans-Pacific and trans-Atlantic transmission events are easily seen, as well as the complex transmission routes between Brazil, Central America and the USA.

            <p/><Link to="/flu">Influenza Virus (via nextflu.org)</Link><p/>

            H1N1 and H3N2 strains of Influenza virus are shown together with antigen evolution, epitope mutations and clade frequency changes over the past 2-12 years. These data and features are being moved over to this site at the moment.


            <h2>Future Directions</h2>

            Nextstrain is under active development and we have big plans for its future, including visualization, bioinformatics analysis and an increasing number and variety of datasets. Please get in touch with <a href="https://twitter.com/richardneher">@richardneher</a> or <a href="https://twitter.com/trvrd">@trvrb</a> with any questions or comments.

					</div>

	        <div className="col-md-1"/>

          <div className="col-md-3 aside">

            Auspice version {version}
            <p/>
            Concept by <a href="http://neherlab.org/">Richard Neher</a> and <a href="http://bedford.io/">Trevor Bedford</a>.

            <p/>

            Built by <a href="http://neherlab.org/">Richard Neher</a>, <a href="http://bedford.io/">Trevor Bedford</a>, <a href="http://www.colinmegill.com/">Colin Megill</a>, <a href="http://bedford.io/team/james-hadfield/">James Hadfield</a>, <a href="http://bedford.io/team/charlton-callender/">Charlton Callender</a>, <a href="http://bedford.io/team/sidney-bell/">Sidney Bell</a>, <a href="http://bedford.io/team/barney-potter/">Barney Potter</a> and <a href="https://twitter.com/sarahinkiwi">Sarah Murata</a>.

            <p/>

            All <a href="http://github.com/nextstrain">source code</a> is freely available under the terms of the <a href="http://github.com/nextstrain/auspice/blob/master/LICENSE.txt">GNU Affero General Public License</a>.

            <p/>
            This work is made possible by the open sharing of genetic data by research groups from all
            over the world. We gratefully acknowledge their contributions.
            <p/>
            Special thanks to Nick Loman, Kristian Andersen, Andrew Rambaut, Matt Cotten and Paul Kellam for comments, suggestions and data sharing.

            <p/>
            Splash page images stylised in <a href="http://www.lunapic.com/">Lunapic</a>. <a href="https://en.wikipedia.org/wiki/Zika_virus#/media/File:197-Zika_Virus-ZikaVirus.tif">Zika drawing</a> by David Goodwill, <a href="https://commons.wikimedia.org/wiki/Ebola#/media/File:Ebola_virus_em.png">Ebola EM</a> by Frederick A. Murphy / CDC, <a href="https://www.cdc.gov/media/subtopic/library/diseases.htm">Influenza TEM</a> by Cynthia Goldsmith / CDC.

          </div>

          <div className="col-md-1"/>

				</div>

        <div className="row">
          <div className="col-md-1"/>
          <div className="col-md-10">
            <div className="line"></div>
            <Flex wrap="wrap" style={{marginTop: 20, justifyContent: "space-around"}}>
              {generateLogos}
            </Flex>
          </div>
          <div className="col-md-1"/>
        </div>

      <div className="bigspacer"></div>

      </div>
    </g>
  );
};

export default About;
