import React from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { makeParentVisible, calcBranchThickness } from "../../util/treeVisibilityHelpers";
import { calcTipCounts } from "../../util/treeCountingHelpers";
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";

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
    this.updateTable(this.props);
  }

  componentDidUpdate(prevProps) {
    console.log("componentDidUpdate", prevProps.visibilityVersion, this.props.visibilityVersion)
    if (prevProps.visibilityVersion<this.props.visibilityVersion){
      this.updateTable(this.props);
    }
  }

  componendWillReceiveProps(nextProps){
    // console.log("componendWillReceiveProps", nextProps)
    // this.updateTable(nextProps);
  }

  updateTable = (props) => {
    if (props.nodes){
      let nodes = [];
      let columns = [];
      const makeLink = row => <a href={row.value}>{row.value}</a>;
      console.log("globbing node info:", props.nodes);
      // This needs to be intersected with the other filters.
      for (let i=0; i<props.nodes.length; i++){
        if (!props.nodes[i].children){
          if (columns.length==0) {
            columns.push({Header:"Filtered", accessor:"vis"});
            columns.push({Header:"Name", accessor:"name"});
            columns.push({Header:"Accession", accessor:"accession"});
            columns.push({Header:"Date", accessor:"date"});
            for (let t in props.nodes[i].node_attrs){
              if (t!=="num_date"){
                columns.push({Header:t, accessor:t});
              }
            }
            columns.push({Header:"URL", accessor:"url", Cell: makeLink});
          }
          let d = {};
          d['vis'] = props.visibility[i] ? 'visible' : 'hidden';
          d['name'] = props.nodes[i].name;
          d['accession'] = props.nodes[i].accession;
          d['url'] = props.nodes[i].url;
          d['date'] = props.nodes[i].node_attrs.num_date.value.toFixed(2);
          d['index'] = props.nodes[i].arrayIdx;
          for (let t in props.nodes[i].node_attrs){
            d[t] = props.nodes[i].node_attrs[t].value;
          }
          nodes.push(d);
        }
      }
      this.setState({nodes:nodes, columns:columns});
    }

  }

  onFilteredChange = (filtered) => {
    this.props.nodes.forEach((d) => d.inTable=false);
    const filteredIndicesTree = this.reactTable.current.getResolvedState().sortedData.map((d) => d._original.index);
    // const filteredIndicesTable = this.reactTable.current.getResolvedState().sortedData.map((d) => d._index);
    for (let i=0;i<filteredIndicesTree.length; i++){
      this.props.nodes[filteredIndicesTree[i]].inTable = true;
    }
    this.props.dispatch(updateVisibleTipsAndBranchThicknesses());
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