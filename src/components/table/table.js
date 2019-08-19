import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { makeParentVisible, calcBranchThickness } from "../../util/treeVisibilityHelpers";
import { calcTipCounts } from "../../util/treeCountingHelpers";
import * as types from "../../actions/types";

// const getVisible = (resolvedState) => {
//   const idxsOfFilteredTips;
//    for each visibile tip, make the parent nodes visible (recursively)
//   for (let i = 0; i < idxsOfFilteredTips.length; i++) {
//     makeParentVisible(filtered, tree.nodes[idxsOfFilteredTips[i]]);
//   }
// };


class Table extends React.Component {
	constructor(props) {
		super(props);
		this.state = {nodes:null};
	  this.reactTable = React.createRef();
  }

  componentDidMount() {
    if (this.props.nodes){
      let nodes = [];
      let columns = [];
      console.log("globbing node info:", this.props.nodes);
      // This needs to be intersected with the other filters.
      for (let i=0; i<this.props.nodes.length; i++){
        if (!this.props.nodes[i].children){
          if (columns.length==0) {
            columns.push({Header:"Name", accessor:"name"});
            columns.push({Header:"Accession", accessor:"accession"});
            columns.push({Header:"Date", accessor:"date"});
            for (let t in this.props.nodes[i].shell.n.traits){
              if (t!=="num_date"){
                columns.push({Header:t, accessor:t});
              }
            }
            columns.push({Header:"URL", accessor:"url"});
          }
          let d = {};
          d['name'] = this.props.nodes[i].name;
          d['accession'] = this.props.nodes[i].accession;
          d['url'] = this.props.nodes[i].url;
          d['date'] = this.props.nodes[i].shell.n.num_date.value.toFixed(2);
          d['index'] = this.props.nodes[i].arrayIdx;
          for (let t in this.props.nodes[i].shell.n.traits){
            d[t] = this.props.nodes[i].shell.n.traits[t].value;
          }
          nodes.push(d);
        }
      }
      this.setState({nodes:nodes, columns:columns});
    }
  }

  componentDidUpdate(prevProps) {
  }


  onFilteredChange = (filtered) => {
    const visArray = this.props.nodes.map((d) => false);
    const filteredIndicesTree = this.reactTable.current.getResolvedState().sortedData.map((d) => d._original.index);
    const filteredIndicesTable = this.reactTable.current.getResolvedState().sortedData.map((d) => d._index);
    for (let i=0;i<filteredIndicesTree.length; i++){
      visArray[filteredIndicesTree[i]] = true;
      makeParentVisible(visArray, this.props.nodes[46]);
    }
    calcTipCounts(this.props.tree.nodes[0], visArray);
    /* re-calculate branchThickness (inline) */
    const data = {
      visibility: visArray,
      visibilityVersion: this.props.tree.visibilityVersion + 1,
      branchThickness: calcBranchThickness(this.props.tree.nodes, visArray, 0),
      branchThicknessVersion: this.props.tree.branchThicknessVersion + 1
    };
    const dispatchObj = {
      type: types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion
    };
    // I am not sure how to go from here...
  }


	render (){
    console.log(this.state);
		return (
		   <ReactTable
        	data={this.state.nodes ? this.state.nodes:[]}
          ref={this.reactTable}
          filterable
          defaultFilterMethod={(filter, row) =>
            String(row[filter.id]).includes(filter.value)}
          onFilteredChange={this.onFilteredChange}
        	columns={ this.state.columns ? this.state.columns:[] }
          defaultSorted={[
            {
              id: "date",
              desc: false
            }
        ]}
        defaultPageSize={10}
        className="-striped -highlight"
      />
      );
	}
}

export default Table;