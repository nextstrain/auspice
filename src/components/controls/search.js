import React from "react";
import { connect } from "react-redux";
import Awesomplete from 'awesomplete'; /* https://leaverou.github.io/awesomplete/ */
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/treeProperties";
import "../../css/awesomplete.css";

@connect((state) => ({
  nodes: state.tree.nodes,
  version: state.tree.version,
  visibility: state.tree.visibility
}))
class SearchStrains extends React.Component {
  constructor() {
    super();
    this.state = {awesomplete: undefined};
  }
  componentDidMount() {
    const awesomplete = new Awesomplete(this.ref);
    this.ref.addEventListener('awesomplete-selectcomplete', (e) => {
      const strain = e.text.value;
      for (let i = 0; i < this.props.nodes.length; i++) {
        if (this.props.nodes[i].strain === strain) {
          this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
            tipSelectedIdx: this.props.nodes[i].arrayIdx
          }));
          break;
        }
      }
    });
    this.setState({awesomplete});
  }
  // partialSelection() {
  //   /* this allows dispatches based on the the list of matches, before one is actually chosen */
  //   /* put his in the <input> onChange={() => this.partialSelection()} */
  //   console.log("partialSelection", this.state.awesomplete.suggestions.map((s) => s.value));
  // }
  updateVisibleStrains() {
    this.state.awesomplete.list = this.props.nodes
      .filter((n) => !n.hasChildren && this.props.visibility[n.arrayIdx] === "visible")
      .map((n) => n.strain);
    this.state.awesomplete.evaluate();
  }
  render() {
    return (
      <div>
        <input
          ref={(r) => {this.ref = r;}}
          onFocus={() => this.updateVisibleStrains()}
        />
      </div>
    );
  }
}

export default SearchStrains;
