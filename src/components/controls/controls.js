import React from 'react';
import Radium from 'radium';
// import _ from 'lodash';
import Flex from '../framework/flex';
import { connect } from 'react-redux';
// import { FOO } from '../actions';
import Button from "../framework/generic-button";
import ToggleBranchLabels from "./toggle-branch-labels";
import ColorBy from "./color-by";
import Search from "./search";
import DateRangeInputs from "./date-range-inputs";
import ChooseLayout from "./choose-layout";
import ChooseVirus from "./choose-virus";
import ChooseMetric from "./choose-metric";
import AllFilters from "./all-filter";


const returnStateNeeded = (fullStateTree) => {
  return {
    controls: fullStateTree.controls,
    metadata: fullStateTree.metadata,
  };
};

@connect(returnStateNeeded)
@Radium
class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  render() {
    return (
      <Flex
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        style={{
          width: 250,
          padding: 20
        }}>
        <ChooseVirus {...this.props}/>
        <DateRangeInputs {...this.props}/>

        <p style={{fontWeight: 500, fontSize: 12}}>FILTERS</p>
        <ColorBy {...this.props}/>
        <AllFilters {...this.props} />
        <ToggleBranchLabels/>
        <Search/>

        <p style={{fontWeight: 500, fontSize: 12}}>TREE OPTIONS</p>
        <p style={{fontWeight: 300, fontSize: 14, color: "rgb(67, 119, 205)", marginBottom: 0}}>Layout</p>
        <ChooseLayout {...this.props}/>
        <p style={{fontWeight: 300, fontSize: 14, color: "rgb(67, 119, 205)", marginBottom: 0}}>Scale</p>

        <ChooseMetric {...this.props}/>

        <p style={{fontWeight: 500, fontSize: 12}}>MAP OPTIONS</p>

      </Flex>
    );
  }
}

export default Controls;

// <Button> Reset Filters </Button>

// <div className="d3-tip se"/>
// <div className="d3-tip e"/>
// <div className="d3-tip"/>
// <div id="date-input"></div>
// <div id="legend-title"></div>
// <div id="legend"></div>
// <div id="gt-color"></div>
// <div id="branchlabels"></div>
// <div id="region"></div>
// <div id="search"></div>
// <div id="straininput"></div>
// <div id="bp-ac"></div>
// <div id="bp-input"></div>
// <div id="searchinputclear"></div>
// <div id="reset"></div>
// <div className="freqplot-container"></div>
// <div className="treeplot-container" id="treeplot-container"></div>
// <div id="updated"></div>
// <div id="commit"></div>
