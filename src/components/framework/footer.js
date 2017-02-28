import React from "react";
import { connect } from "react-redux";
import { dataFont, medGrey } from "../../globalStyles";
import computeResponsive from "../../util/computeResponsive";
import Flex from "./flex";
import Radium from "radium";
import d3 from "d3";

@connect((state) => {
  return {
    tree: state.tree,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
@Radium
class Footer extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    style: React.PropTypes.object.isRequired
  }
  getStyles() {
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
  }
  getCitations(styles) {
    // traverse tree.nodes
    // check if !hasChildren
    // in each node there is attr.authors and attr.url
    // construct array of unique author strings
    let authorsSet = d3.set();
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
    const authorsListItems = authorsSet.values().sort().map((authors, index) => {
        return (
          <div key={index} style={styles.citationItem}>
            {authorsToURL[authors] ?
              <a href={authorsToURL[authors]} target="_blank">{authors}</a> :
              authors}
          </div>
        );
      });
    return (
      <Flex wrap="wrap" justifyContent="flex-start" alignItems="center" style={styles.citationList}>
        {authorsListItems}
      </Flex>
    );
  }
  getUpdated(styles) {
    let updated = null;
    if (this.props.metadata) {
      if (this.props.metadata.updated) {
        updated = this.props.metadata.updated;
      }
    }
    return (
      updated ?
        <Flex style={styles.fineprint}>
          Data updated {updated}
        </Flex> :
        <div/>
    )
  }
  drawFooter(styles, width) {
    return (
      <div style={{width: width}}>
        <div style={styles.line}/>
        This work is made possible by the open sharing of genetic data by research groups from all
        over the world. We gratefully acknowledge their contributions. For data reuse (particularly
        for publication), please contact the original authors:
        {this.getCitations(styles)}
        <div style={styles.line}/>
        {this.getUpdated(styles)}
      </div>
    );
  }
  render() {
    const styles = this.getStyles();
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: .3333333,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    })
    const width = responsive.width - 30; // need to subtract margin when calculating div width
    return (
      <div style={styles.footer}>
        {this.props.tree && this.props.browserDimensions ? this.drawFooter(styles, width) : "Waiting on citation data"}
      </div>
    );
  }
}

export default Footer;
