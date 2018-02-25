import React from "react";
import { connect } from "react-redux";
import Awesomplete from 'awesomplete'; /* https://leaverou.github.io/awesomplete/ */
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/treeProperties";
import "../../css/awesomplete.css";

@connect((state) => ({
  nodes: state.tree.nodes,
  version: state.tree.version
}))
class SearchStrains extends React.Component {
  constructor() {
    super();
    this.state = {awesomplete: undefined};
  }
  componentDidMount() {
    this.ref.addEventListener('awesomplete-selectcomplete', (e) => {
      console.log("you've selected", e.text.value);
      const strain = e.text.value;
      for (let i = 0; i < this.props.nodes.length; i++) {
        if (this.props.nodes[i].strain === strain) {
          console.log(this.props.nodes[i]);
          this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
            tipSelectedIdx: this.props.nodes[i].arrayIdx
          }));
          break;
        }
      }
    });
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.version !== nextProps.version && nextProps.version) {
      console.log("CWRP version change", nextProps.version, this.ref);
      const awesomplete = new Awesomplete(this.ref, {
        list: this.props.nodes.filter((n) => !n.hasChildren).map((n) => n.strain)
      });
      this.setState({awesomplete});
    }
  }
  // partialSelection() {
  //   /* this allows dispatches based on the the list of matches, before one is actually chosen */
  //   /* put his in the <input> onChange={() => this.partialSelection()} */
  //   console.log("partialSelection", this.state.awesomplete.suggestions.map((s) => s.value));
  // }
  render() {
    return (
      <div>
        <input
          ref={(r) => {this.ref = r;}}
        />
      </div>
    );
  }
}

export default SearchStrains;
