import React from "react";
import { connect } from "react-redux";
import Awesomplete from 'awesomplete'; /* https://leaverou.github.io/awesomplete/ */
import { withTranslation } from "react-i18next";
import styled from 'styled-components';
import { updateVisibleTipsAndBranchThicknesses, updateTipRadii } from "../../actions/tree";
import { NODE_VISIBLE, controlsWidth } from "../../util/globals";
import { SidebarSubtitle } from "./styles";
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

const Container = styled.div`
  font-family: ${(props) => props.theme["font-family"]};
  font-size: 14px;
  display: inline-block;
  color: ${(props) => props.theme.color};
`;

const InputContainer = styled.div`
  width: ${controlsWidth-10}px; /* awesomplete includes 10px of padding & border */
  display: inline-block;
`;

const Input = styled.input`
  fontFamily: inherit;
  color: inherit;
  fontSize: inherit;
  width: 100%;
  height: 23px;
  padding-left: 7px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

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
    this.ref.addEventListener('input', (e) => {
      const strain = e.target.value.toLowerCase().trim();
      this.props.dispatch(updateTipRadii({
        searchNodes: (strain.length > 1) ? strain : ""
      }));
    });
    this.ref.addEventListener('awesomplete-selectcomplete', (e) => {
      const strain = e.text.value;
      for (let i = 0; i < this.props.nodes.length; i++) {
        if (this.props.nodes[i].name === strain) {
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
      .map((n) => n.name);
    this.state.awesomplete.evaluate();
  }
  render() {
    const { t } = this.props;
    return (
      <Container>
        <SidebarSubtitle spaceAbove>{t("sidebar:Search Strains")}</SidebarSubtitle>
        <InputContainer>
          <Input ref={(r) => {this.ref = r;}} onFocus={() => this.updateVisibleStrains()}/>
        </InputContainer>
        <Cross show={this.state.show} onClick={this.removeSelection}/>
      </Container>
    );
  }
}

const WithTranslation = withTranslation()(SearchStrains);
export default WithTranslation;
