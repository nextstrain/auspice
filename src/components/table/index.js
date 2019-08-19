import { connect } from "react-redux";
import UnconnectedTable from "./table";

const Table = connect((state) => ({
  nodes: state.tree.nodes,
  tree: state.tree,
  dateMinNumeric: state.controls.dateMinNumeric,
  dateMaxNumeric: state.controls.dateMaxNumeric,
  metadata: state.metadata,
  narrativeMode: state.narrative.display
}))(UnconnectedTable);

export default Table;
