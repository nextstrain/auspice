import React from "react";
import { connect } from "react-redux";
import Awesomplete from 'awesomplete'; /* https://leaverou.github.io/awesomplete/ */
import { updateVisibleTipsAndBranchThicknesses, updateTipRadii } from "../../actions/tree";
import { dataFont, darkGrey } from "../../globalStyles";
import { NODE_VISIBLE } from "../../util/globals";
import { SelectLabel } from "../framework/select-label";
import "../../css/awesomplete.css";

const Cross = ({onClick, show}) => {
  if (!show) return null;
  return (
    <div
      className="boxed-item-icon"
      style={{
        float: "right",
        height: "23px",
        width: "23px",
        borderTopRightRadius: "2px",
        borderBottomRightRadius: "2px",
        borderRightWidth: "1px",
        fontSize: 18
      }}
      onClick={onClick}
    >
      {'\xD7'}
    </div>
  );
};

@connect((state) => ({
  nodes: state.tree.nodes,
  version: state.tree.version,
  visibility: state.tree.visibility,
  selectedStrain: state.tree.selectedStrain
}))
class SearchStrains extends React.Component {
  constructor() {
    super();
    this.state = {awesomplete: undefined, show: false};
    this.removeSelection = () => {
      this.ref.value = null;
      this.props.dispatch(updateVisibleTipsAndBranchThicknesses({tipSelected: {clear: true}}));
      this.props.dispatch(updateTipRadii());
      this.setState({show: false});
    };
  }
  componentDidMount() {
    const awesomplete = new Awesomplete(this.ref, {
      maxItems: 1000
    });
    this.ref.addEventListener('awesomplete-selectcomplete', (e) => {
      const strain = e.text.value;
      for (let i = 0; i < this.props.nodes.length; i++) {
        if (this.props.nodes[i].strain === strain) {
          this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
            tipSelected: {treeIdx: this.props.nodes[i].arrayIdx}
          }));
          /* ^^^ also sets reduxState.tree.selectedStrain */
          this.props.dispatch(updateTipRadii({
            tipSelectedIdx: this.props.nodes[i].arrayIdx
          }));
          break;
        }
      }
      this.setState({show: true});
    });
    this.setState({awesomplete});
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.selectedStrain && !nextProps.selectedStrain) {
      this.ref.value = null;
      this.setState({show: false});
    }
  }
  // partialSelection() {
  //   /* this allows dispatches based on the the list of matches, before one is actually chosen */
  //   /* put his in the <input> onChange={() => this.partialSelection()} */
  //   console.log("partialSelection", this.state.awesomplete.suggestions.map((s) => s.value));
  // }
  updateVisibleStrains() {
    /* this tells the serch box which strains are visible
    and therefore are eligible to be searched */
    this.state.awesomplete.list = this.props.nodes
      .filter((n) => !n.hasChildren && this.props.visibility[n.arrayIdx] === NODE_VISIBLE)
      .map((n) => n.strain);
    this.state.awesomplete.evaluate();
  }
  render() {
    return (
      <div style={{fontFamily: dataFont, color: darkGrey, fontSize: 14, display: "inline-block"}}>
        <SelectLabel text="Search Strains"/>
        <div style={{width: "80%", display: "inline-block"}}>
          <input
            style={{fontFamily: "inherit", color: "inherit", fontSize: "inherit", width: "100%", height: "23px", paddingLeft: "7px", borderRadius: "4px", border: "1px solid #ccc"}}
            ref={(r) => {this.ref = r;}}
            onFocus={() => this.updateVisibleStrains()}
          />
        </div>
        <Cross show={this.state.show} onClick={this.removeSelection}/>
      </div>
    );
  }
}

export default SearchStrains;
