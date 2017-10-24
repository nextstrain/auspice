import React from "react";
import { connect } from "react-redux";
import { titleFont, headerFont, medGrey, darkGrey } from "../../globalStyles";
// import { applyFilterQuery, changeDateFilter } from "../../actions/treeProperties";
// import { CHANGE_TREE_ROOT_IDX } from "../../actions/types";
import { controlsWidth } from "../../util/globals";
import MagicBlock from "./magicBlock";
import { changeDateFilter } from "../../actions/treeProperties";

const styles = {
  fontFamily: headerFont,
  fontSize: 16,
  // marginLeft: 10,
  // marginTop: 5,
  // marginBottom: 5,
  fontWeight: 300,
  color: medGrey,
  width: controlsWidth,
  padding: "0px 20px 20px 20px"
};

@connect((state) => {
  return {};
})
class Narrative extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className={"narrative"} style={styles}>
        <p/>
        <i>
          {"As you hover over the paragraphs in this report, the view into the data will react accordingly"}
        </i>
        <p style={{color: darkGrey}}>
          {"Zika virus in the Americas"}
        </p>
        <MagicBlock
          callback={() => console.log("mouseover")}
          content="This doesn't actually do anything"
        />
        <MagicBlock
          callback={() => console.log("mouseover")}
          content={<i>some JSX</i>}
        />
        <MagicBlock
          callback={() => {
            this.props.dispatch(changeDateFilter({newMax: '2014-01-01'}));
          }}
          content={
            `Prior to 2014 zika virus had only been observed in Asia & Oceiania.
            Epidemiological reports indicate that the sequences shown here represent only a fraction of
            the overall disease prevalence.
            `
          }
        />
        <MagicBlock
          callback={() => {
            this.props.dispatch(changeDateFilter({newMax: '2015-01-01'}));
          }}
          content={
            `As we move forward to 2015, the phologenetic reconstruction indicates that the virus
            had spread to Brazil, Haiti, Honduras, Columbia and possible Venezuela and the USVI.
            However this reconstruction is based upon all currently available data - in reality,
            only a handful of sequences from Haiti had been sequenced (had they?).
            `
          }
        />
      </div>
    );
  }
}
export default Narrative;
