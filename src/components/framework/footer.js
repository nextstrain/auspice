import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { dataFont, medGrey, materialButton } from "../../globalStyles";
import { prettyString } from "../../util/stringHelpers";
import computeResponsive from "../../util/computeResponsive";
import { TRIGGER_DOWNLOAD_MODAL } from "../../actions/types";
import Flex from "./flex";
import { enableDownloadModal } from "../../util/globals";
import { applyFilterQuery } from "../../actions/treeProperties";

const getAuthorsFromTreeJSON = (nodes) => {
  /* this fn generates the author_info object to be found in meta.JSON from the tree.JSON
  once all augur builds are updated we can remove this and get this from meta.JSON */
  const author_info = {};
  nodes.forEach((node) => {
    if (node.children) { return; }
    if (node.attr.authors !== "" && node.attr.authors !== "?") {
      if (Object.keys(author_info).indexOf(node.attr.authors) === -1) {
        author_info[node.attr.authors] = {n: 1};
      } else {
        author_info[node.attr.authors].n += 1;
      }
    }
  });
  return author_info;
};


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
    browserDimensions: state.browserDimensions.browserDimensions,
    selectedAuthors: state.controls.filters.authors
  };
})
class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.getStyles = () => {
      const styles = {
        footer: {
          textAlign: "justify",
          marginLeft: "30px",
          // marginBottom: "30px",
          // padding: "0px",
          paddingBottom: "30px",
          fontFamily: dataFont,
          fontSize: 15,
          fontWeight: 300,
          color: medGrey
        },
        citationList: {
          marginTop: "10px"
        },
        citationItem: {
          paddingLeft: "4px",
          paddingRight: "4px",
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
      styles.filterAuthOn = { ...styles.citationItem, ...{cursor: "pointer", color: '#007AB6', fontWeight: 700}}
      styles.filterAuthOff = { ...styles.citationItem, ...{cursor: "pointer", color: '#5097BA', fontWeight: 300}}
      return styles
    };
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  shouldComponentUpdate(nextProps) {
    if (
      this.props.tree.version !== nextProps.tree.version ||
        this.props.browserDimensions !== nextProps.browserDimensions ||
        this.props.selectedAuthors !== nextProps.selectedAuthors
    ) {
      return true;
    }
    return false;
  }

  filterAuthor(authors) {
    const mode = this.props.selectedAuthors.indexOf(authors) === -1 ? "add" : "remove";
    this.props.dispatch(applyFilterQuery("authors", [authors], mode));
  }

  getCitations(styles) {
    if (this.context.router.history.location.pathname.includes("h7n9")) {
      return generateH7N9citations(styles);
    } else if (this.context.router.history.location.pathname.includes("flu")) {
      return null; /* FIX ME */
    }
    /* in future, get this from meta.json */
    const author_info = getAuthorsFromTreeJSON(this.props.tree.nodes);

    const authorsListItems = Object.keys(author_info).sort().map((authors) => {
      return (
        <div
          style={this.props.selectedAuthors.indexOf(authors) === -1 ? styles.filterAuthOff : styles.filterAuthOn}
          key={authors}
          onClick={() => {this.filterAuthor(authors);}}
          role="button"
          tabIndex={0}
        >
          {prettyString(authors, {stripEtAl: true})}
          {" et al (" + author_info[authors].n + ")"}
        </div>
      );
    });

    return (
      <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
        {authorsListItems}
      </Flex>
    );
  }

  getAdditionalInfo(styles) {
    if (this.context.router.history.location.pathname.includes("ebola")) {
      return (
        <div style={styles.citationList}>
          For a more complete phylogeographic analysis of these data see <a target="_blank" rel="noreferrer noopener" href="http://dx.doi.org/10.1038/nature22040">Dudas et al</a>. Curated data used in the paper are available at <a target="_blank" rel="noreferrer noopener" href="https://github.com/ebov/space-time">github.com/ebov/space-time</a>. The animation shown here was inspired by <a target="_blank" rel="noreferrer noopener" href="https://youtu.be/eWnIhWUpQiQ">a work</a> by <a target="_blank" rel="noreferrer noopener" href="http://bedford.io/team/gytis-dudas/">Gytis Dudas</a>.
        </div>
      );
    }
    return (
      <div/>
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
    let text = "This work is made possible by the open sharing of genetic data by research groups from all over the world. We gratefully acknowledge their contributions. Click the authors to display their data in the global context.";
    if (this.context.router.history.location.pathname.includes("h7n9")) {
      text = (
        <div>
          This work is made possible by the open sharing of genetic data by research groups from all over the world via <a href="http://platform.gisaid.org/">GISAID</a>. For data reuse please contact the submitting labs (listed below) or see <a href="http://data.nextstrain.org/flu_h7n9_acknowledgement_table.xls">this spreadsheet</a> for a full list of authors and samples available.
        </div>
      );
    } else if (this.context.router.history.location.pathname.includes("flu")) {
      text = (
        <div>
          This work is made possible by the open sharing of genetic data by research groups from all over the world via <a href="http://platform.gisaid.org/">GISAID</a>. We gratefully acknowledge their contributions.
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
        {this.getAdditionalInfo(styles)}
        <div style={styles.line}/>
        <Flex style={styles.fineprint}>
          {this.getUpdated()}
        </Flex>
      </div>
    );
  }
  render() {
    if (!this.props.metadata || !this.props.tree.nodes) return null;
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
        {this.drawFooter(styles, width)}
      </div>
    );
  }
}

export default Footer;
