import React from "react";
import { connect } from "react-redux";
import { set } from "d3-collection";
import { dataFont, medGrey, materialButton } from "../../globalStyles";
// import { authorString } from "../../util/stringHelpers";
import computeResponsive from "../../util/computeResponsive";
import { TRIGGER_DOWNLOAD_MODAL } from "../../actions/types";
import Flex from "./flex";
import { getAuthor } from "../controls/downloadModal";
import { enableDownloadModal } from "../../util/globals";

const generateH7N9citations = (styles) => {
  return (
    <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
      <div style={styles.citationItem}>
        <a href="http://www.afcd.gov.hk/eindex.html" target="_blank" rel="noreferrer noopener">Agriculture, Fisheries and Conservation Department</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://english.shanghaipasteur.cas.cn/" target="_blank" rel="noreferrer noopener">Institute Pasteur of Shanghai, CAS</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.chp.gov.hk/en/phlsb/8/23/40.html" target="_blank" rel="noreferrer noopener">Public Health Laboratory Services Branch, Centre for Health Protection</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://liferiver.en.ecplaza.net/" target="_blank" rel="noreferrer noopener">Shanghai Zhijiang Biotechnology Co</a>
      </div>
      <div style={styles.citationItem}>
        Beijing Institute of Microbiology and Epidemiology
      </div>
      <div style={styles.citationItem}>
        <a href="https://www.cdc.gov/" target="_blank" rel="noreferrer noopener">Centers for Disease Control and Prevention</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.wur.nl/en/Expertise-Services/Research-Institutes/Bioveterinary-Research.htm" target="_blank" rel="noreferrer noopener">Central Veterinary Institute</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.chinacdc.cn/en/" target="_blank" rel="noreferrer noopener">Fujian Center for Disease Control and Prevention</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.chinacdc.cn/en/" target="_blank" rel="noreferrer noopener">Guandong Centers for Disease Control</a>
      </div>
      <div style={styles.citationItem}>
        Guangzhou Institute of Respiratory Diseases (GIRD)
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.chinacdc.cn/en/" target="_blank" rel="noreferrer noopener">Hangzhou Center for Disease Control and Prevention</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.hvri.ac.cn/en/" target="_blank" rel="noreferrer noopener">Harbin Veterinary Research Institute (CAAS)</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.chinacdc.cn/en/" target="_blank" rel="noreferrer noopener">Jiangsu Provincial Center for Disease Control & Prevention</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.phac-aspc.gc.ca/index-eng.php" target="_blank" rel="noreferrer noopener">Public Health Agency of Canada (PHAC)</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.med.stu.edu.cn/eng/" target="_blank" rel="noreferrer noopener">Shantou University Medical College</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://english.scau.edu.cn/" target="_blank" rel="noreferrer noopener">South China Agricultural University</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.cdc.gov.tw/rwd/english" target="_blank" rel="noreferrer noopener">Taiwan CDC</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.cnic.org.cn/" target="_blank" rel="noreferrer noopener">WHO Chinese National Influenza Center</a>
      </div>
      <div style={styles.citationItem}>
        <a href="http://www.chinacdc.cn/en/" target="_blank" rel="noreferrer noopener">Zhejiang Provincial Center for Disease Control and Prevention</a>
      </div>
    </Flex>
  );
};


const dot = (
  <span style={{marginLeft: 10, marginRight: 10}}>
    •
  </span>
);

@connect((state) => {
  return {
    tree: state.tree,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.getStyles = () => {
      return {
        footer: {
          textAlign: "justify",
          marginLeft: "30px",
          // marginBottom: "30px",
          // padding: "0px",
          paddingBottom: "30px",
          fontFamily: dataFont,
          fontSize: 16,
          fontWeight: 300,
          color: medGrey
        },
        citationList: {
          marginTop: "10px"
        },
        citationItem: {
          paddingLeft: "0px",
          paddingRight: "10px",
          paddingTop: "1px",
          paddingBottom: "0px"
        },
        line: {
          marginTop: "20px",
          marginBottom: "20px",
          borderBottom: "1px solid #CCC"
        },
        fineprint: {
          fontSize: 14
        }
      };
    };
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  shouldComponentUpdate(nextProps) {
    if (this.props.tree.version !== nextProps.tree.version ||
        this.props.browserDimensions !== nextProps.browserDimensions) {
      return true;
    }
    return false;
  }

  getCitations(styles) {
    if (this.context.router.history.location.pathname.includes("h7n9")) {
      generateH7N9citations(styles);
    }
    // traverse tree.nodes
    // check if !hasChildren
    // in each node there is attr.authors and attr.url
    // construct array of unique author strings
    let authorsSet = set();
    let authorsToURL = {};
    if (this.props.tree) {
      if (this.props.tree.nodes) {
        this.props.tree.nodes.forEach((node) => {
          if (node.children) { return; }
          if (node.attr.authors !== "" && node.attr.authors !== "?") {
            authorsSet.add(node.attr.authors);
            if (node.attr.url) {
              authorsToURL[node.attr.authors] = node.attr.url;
            }
          }
        });
      }
    }
    const authorsListItems = authorsSet.values().sort().map((authors) => {
      return (
        <div key={authors} style={styles.citationItem}>
          {getAuthor(this.props.metadata.author_info, authors)}
        </div>
      );
    });
    return (
      <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
        {authorsListItems}
      </Flex>
    );
  }
  getUpdated() {
    let updated = null;
    if (this.props.metadata) {
      if (this.props.metadata.updated) {
        updated = this.props.metadata.updated;
      }
    }
    if (!updated) return null;
    return (
      <span>Data updated {updated}</span>
    );
  }
  downloadDataButton() {
    return (
      <button
        style={Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)", margin: 0, padding: 0})}
        onClick={() => { this.props.dispatch({ type: TRIGGER_DOWNLOAD_MODAL }); }}
      >
        <span style={{position: "relative"}}>{"DOWNLOAD DATA"}</span>
      </button>
    );
  }
  getMaintainer() {
    if (Object.prototype.hasOwnProperty.call(this.props.metadata, "maintainer")) {
      return (
        <span>
          dataset maintained by <a href={this.props.metadata.maintainer[1]} target="_blank">{this.props.metadata.maintainer[0]}</a>
        </span>
      );
    }
    return null;
  }
  drawFooter(styles, width) {
    let text = "This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions. For data reuse (particularly for publication), please contact the original authors:";
    if (this.context.router.history.location.pathname.includes("h7n9")) {
      text = (
        <div>
          This work is made possible by the open sharing of genetic data by research groups from all over the world via <a href="http://platform.gisaid.org/">GISAID</a>. For data reuse please contact the submitting labs (listed below) or see <a href="http://data.nextstrain.org/flu_h7n9_acknowledgement_table.xls">this spreadsheet</a> for a full list of authors and samples available.
        </div>
      );
    }
    if (enableDownloadModal) {
      return (
        <div style={{width: width}}>
          <div style={styles.line}/>
          {text}
          {this.getCitations(styles)}
          <div style={styles.line}/>
          <Flex style={styles.fineprint}>
            {this.getUpdated()}
            {dot}
            {this.downloadDataButton()}
            {dot}
            {this.getMaintainer()}
          </Flex>
        </div>
      );
    }
    return (
      <div style={{width: width}}>
        <div style={styles.line}/>
        {text}
        {this.getCitations(styles)}
        <div style={styles.line}/>
        <Flex style={styles.fineprint}>
          {this.getUpdated()}
        </Flex>
      </div>
    );
  }
  render() {
    if (!this.props.metadata) return null;
    const styles = this.getStyles();
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: 0.3333333,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    });
    const width = responsive.width - 30; // need to subtract margin when calculating div width
    return (
      <div style={styles.footer}>
        {this.props.tree && this.props.browserDimensions ? this.drawFooter(styles, width) : "Waiting on citation data"}
      </div>
    );
  }
}

export default Footer;
