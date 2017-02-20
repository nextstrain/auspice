/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
// import { connect } from "react-redux";
import Flex from "../components/framework/flex";
import TitleBar from "../components/framework/title-bar";

/* helper / generating functions */
const generateLogos = [
  <a href="http://www.fredhutch.org/">
    <img width="125" src={require("../images/fred-hutch-logo-small.png")}/>
  </a>,
  <a href="http://www.eb.tuebingen.mpg.de/">
    <img width="60" src={require("../images/max-planck-logo-small.png")}/>
  </a>,
  <a href="https://www.nih.gov/">
    <img width="52" src={require("../images/nih-logo-small.png")}/>
  </a>,
  <a href="https://erc.europa.eu/">
    <img width="60" src={require("../images/erc-logo-small.png")}/>
  </a>
];

const About = () => {
  return(
    <g>
      <TitleBar/>

			<div className="static container">

				<div className="bigspacer"></div>

				<div className="row">
					<div className="col-md-3"></div>
					<h1 className="col-md-7">
            Real-time tracking of virus evolution
          </h1>
        </div>

        <div className="row">
					<div className="col-md-3">
						<h2>Why is this Important?</h2>
					</div>

					<div className="col-md-7">
            This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions. For data reuse (particularly for publication), please contact the original authors...
					</div>
				</div>

        <div className="row">
					<div className="col-md-3">
						<h2>Data Sources</h2>
					</div>

					<div className="col-md-7">
            This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions. For data reuse (particularly for publication), please contact the original authors...
					</div>
				</div>

        <div className="row">
					<div className="col-md-3"></div>
          <div className="col-md-7">
            <div className="line"></div>
          </div>
        </div>

        <div className="row">
					<div className="col-md-3"></div>

					<div className="col-md-7">
            Concept by <a href="https://neherlab.wordpress.com/">Richard Neher</a> and <a href="http://bedford.io/">Trevor Bedford</a>.
            <p/>
            Built by <a href="https://neherlab.wordpress.com/">Richard Neher</a>, <a href="http://bedford.io/">Trevor Bedford</a>,&nbsp;
            <a href="http://www.colinmegill.com/">Colin Megill</a>&nbsp;
            and <a href="http://bedford.io/team/james-hadfield/">James Hadfield</a>.
            <p/>
            All <a href="http://github.com/nextstrain">source code</a> is freely available under the terms of the <a href="http://github.com/blab/nextflu/blob/master/LICENSE.txt">GNU Affero General Public License</a>.
            {/*
            <p/>
            Auspice commit {__COMMIT_HASH__}
            */}
					</div>
				</div>

        <div className="row">
          <div className="col-md-3"></div>
          <div className="col-md-7">
            <div className="line"></div>
            <Flex style={{marginTop: 20, justifyContent: "space-around"}}>
              {generateLogos}
            </Flex>
          </div>
        </div>


      </div>
    </g>
  );
};

export default About;
