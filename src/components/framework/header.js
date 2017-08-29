/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import { connect } from "react-redux";
import {infoPanelStyles, dataFont} from "../../globalStyles";
import {prettyString, authorString} from "../../util/stringHelpers";
import {applyFilterQuery} from "../../actions/treeProperties";

const makeStyles = (sidebar) => {
  return {
    container: {
      position: "relative",
      // verticalAlign: "top",
      left: 10, top: 5,
      height: 25,
      width: sidebar ? 'calc(100% - 50px)' : 'calc(100% - 33px)', /* FIX ME */
      marginBottom: 7,
      paddingTop: 5, paddingRight: 5,
      // paddingTop: 7, paddingBottom: 9, paddingLeft: 10, paddingRight: 30,
      borderRadius: 5,
      pointerEvents: "all",
      backgroundColor: "rgba(151, 155, 155, 0.85)",
      zIndex: 1000,
      color: "#fff",
      fontFamily: dataFont, fontSize: 14, fontWeight: 400
    }
  };
};

@connect((state) => {
  return {
    filters: state.controls.filters,
    metadata: state.metadata
  };
})
class Header extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    sidebar: React.PropTypes.bool.isRequired,
    filters: React.PropTypes.object.isRequired,
    metadata: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired
  }

  clearAuthors() {
    this.props.dispatch(
      applyFilterQuery("authors", ["authors"], [])
    );
  }

  makeText() {
    if (!this.props.metadata.metadata) {
      return null;
    }
    const metadata = this.props.metadata.metadata;
    if (!this.props.filters.hasOwnProperty("authors") || this.props.filters.authors.length === 0) {
      const numAuths = Object.keys(metadata.author_info).length;
      return (<g>
          <span style={infoPanelStyles.branchInfoHeading}>{metadata.title}</span>
          <span style={infoPanelStyles.comment}>{` ${metadata.virus_count} samples from ${numAuths} publications`}</span>
        </g>);
    }
    let inner;
    const data = this.props.filters.authors.map((v) => ({
      name: authorString(v),
      n: metadata.author_info[v].n,
      title: prettyString(metadata.author_info[v].title)
    }));
    if (data.length === 1) {
      inner = (<g>
          <span style={infoPanelStyles.branchInfoHeading}>{data[0].name}</span>
          <span style={infoPanelStyles.comment}>{`  (${data[0].n} sequences)`}</span>
          <span style={infoPanelStyles.branchInfoHeading}>{data[0].title}</span>
        </g>);
    } else if (data.length < 4) {
      inner = (<g>{data.map((cv, idx) => (
        <g key={idx}>
          <span style={infoPanelStyles.branchInfoHeading}>{cv.name}</span>
          <span style={infoPanelStyles.comment}>{`  (${cv.n} sequences)`}</span>
        </g>
      ))}</g>);
    } else {
      inner = (<g>
          <span style={infoPanelStyles.branchInfoHeading}>{`${data.length} authors selected`}</span>
        </g>);
    }
    return inner;
  }

  makeButton() {
    return (!this.props.filters.hasOwnProperty("authors") || this.props.filters.authors.length === 0) ?
      null :
      (
        <button style={infoPanelStyles.buttonLink} onClick={() => this.clearAuthors()}>
          {"clear author filters"}
        </button>
      );
  }

  render() {
    const styles = makeStyles(this.props.sidebar);
    return (
      <div style={styles.container}>
        {this.makeText()}
        {this.makeButton()}
      </div>
    );
  }
}

export default Header;
