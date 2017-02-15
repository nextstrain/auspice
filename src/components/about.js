/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import { connect } from "react-redux";
import Flex from "./framework/flex";
import { textStyles } from "../globalStyles";
import TitleBar from "./framework/title-bar";

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

const link = (url, text) => (
  <a href={url} style={textStyles.link}>
    {text}
  </a>
);

const thanksText = (
  <g>
    This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions. For data reuse (particularly for publication), please contact the original authors...
  </g>
);

const builtByText = (
  <g>
    Concept by {link("https://neherlab.wordpress.com/", "Richard Neher")} and {link("http://bedford.io/", "Trevor Bedford")}.
    <p/>
    Built by {link("https://neherlab.wordpress.com/", "Richard Neher")}, {link("http://bedford.io/", "Trevor Bedford")},&nbsp;
    {link("http://www.colinmegill.com/", "Colin Megill")}&nbsp;
    and {link("http://bedford.io/team/james-hadfield/", "James Hadfield")}.
    <p/>
    All {link("github.com/nextstrain/auspice", "source code")} is freely available under the terms of the {link("http://github.com/blab/nextflu/blob/master/LICENSE.txt", "GNU Affero General Public License")}.
    {/*
    <p/>
    Auspice commit {__COMMIT_HASH__}
    */}
  </g>
);

@connect()
class About extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    const styles = textStyles;
    return(
      <g>
        <TitleBar/>
        <Flex style={styles.main}>
          <div style={{flex: 1 }}/>
          <div style={{flex: 3 }}>
            <div style={[styles.headers, styles.title]}>
              Real-time tracking of virus evolution
            </div>

            <div style={styles.headers}>Data Sources</div>
            <div style={styles.text}>{thanksText}</div>

            <div style={styles.line}/>
            <div style={styles.text}>{builtByText}</div>

            <div style={styles.line}/>
            <Flex style={styles.logos}>
              {generateLogos}
            </Flex>
          </div>
          <div style={{flex: 1 }}/>
        </Flex>
      </g>
    );
  }
}

export default About;
