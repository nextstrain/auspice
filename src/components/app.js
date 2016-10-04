import React from "react";
import { connect } from "react-redux";
import {
  populateMetadataStore,
  populateTreeStore,
  populateSequencesStore,
  populateFrequenciesStore,
  populateEntropyStore
} from "../actions";

import Radium from "radium";
import _ from "lodash";
// import {Link} from "react-router";
// import Awesome from "react-fontawesome";
import Flex from "./framework/flex";
import Header from "./framework/header";
import Controls from "./controls/controls";
import Frequencies from "./charts/frequencies";
import Entropy from "./charts/entropy";
import Map from "./map/map";
import TreeView from "./tree/treeView";
import Footer from "./framework/footer";
import parseParams from "../util/parseParams";
import queryString from "query-string";
import getColorScale from "../util/getColorScale";
import { parseGenotype, getGenotype } from "../util/getGenotype";
import {colorOptions} from "../util/globals";

const returnStateNeeded = (fullStateTree) => {
  return {
    tree: fullStateTree.tree,
    sequences: fullStateTree.sequences,
    selectedLegendItem: fullStateTree.controls.selectedLegendItem
  };
};
@connect(returnStateNeeded)
@Radium
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: false,
      location: {
        pathname: window.location.pathname,
        query: queryString.parse(window.location.search)
      },
      colorScale:{
        colorBy: null,
        scale: null,
        legendBoundsMap: null,
        continuous: null
      },
      // sidebarDocked: true,
    };
  }
  static propTypes = {
    /* react */
    dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    /* component api */
    error: React.PropTypes.object,
    loading: React.PropTypes.bool,
    user: React.PropTypes.object,
    routes: React.PropTypes.array
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"

  }

  /******************************************
   * LIFECYLCE METHODS
   *****************************************/

  componentWillReceiveProps(nextProps) {
  }

  componentDidMount() {
    console.log('registering');
    // when the user hits the back button or forward, let us know so we can setstate again
    // all of the other intentional route changes we will manually setState
    const tmpQuery = queryString.parse(window.location.search);
    this.maybeFetchDataset();
    const cScale = this.updateColorScale(tmpQuery.colorBy || "region");
    window.addEventListener("popstate", (a, b, c) => {
      this.setState({
        location: {
          pathname: window.location.pathname.slice(1, -1),
          query: tmpQuery
        },
        colorScale: cScale
      });
    });
  }

  componentDidUpdate() {
    this.maybeFetchDataset();
    if (!this.state.nodeColor && this.props.tree.nodes) {
      const cScale = this.updateColorScale(this.state.location.query.colorBy || "region");
      this.setState(cScale);
    }
  }

  maybeFetchDataset() {
    if (this.state.latestValidParams === this.state.location.pathname) {
      return;
    }

    const parsedParams = parseParams(this.state.location.pathname);
    const tmp_levels = Object.keys(parsedParams.dataset).map((d) => parsedParams.dataset[d]);
    tmp_levels.sort((x, y) => x[0] > y[0]);
    // make prefix for data files with fields joined by _ instead of / as in URL
    const data_path = tmp_levels.map((d) => d[1]).join("_");
    if (parsedParams.incomplete) {
      this.setVirusPath(parsedParams.fullsplat);
    }
    if (parsedParams.valid && this.state.latestValidParams !== parsedParams.fullsplat) {
      console.log("attempting to load ", data_path, "prev: ", this.state.latestValidParams);
      this.props.dispatch(populateMetadataStore(data_path));
      this.props.dispatch(populateTreeStore(data_path));
      this.props.dispatch(populateSequencesStore(data_path));
      this.props.dispatch(populateFrequenciesStore(data_path));
      this.setState({latestValidParams: parsedParams.fullsplat});
    }
  }

  /******************************************
   * HANDLE QUERY PARAM CHANGES AND ASSOCIATED STATE UPDATES
   *****************************************/
  setVirusPath(newPath) {
    const prefix = (newPath === "" || newPath[0] === "/") ? "" : "/";
    const suffix = (newPath.length && newPath[newPath.length - 1] !== "/") ? "/?" : "?";
    const url = prefix + newPath + suffix + queryString.stringify(this.state.location.query);
    window.history.pushState({}, "", url);
    this.changeRoute(newPath, this.state.location.query);
  }

  getTipColorAttribute(node, cScale) {
    if (cScale.colorBy.slice(0,3) === "gt-") {
        return getGenotype(cScale.genotype[0][0],
                                  cScale.genotype[0][1],
                                  node, this.props.sequences.sequences);
    } else {
      return node.attr[cScale.colorBy];
    };
  }

  updateColorScale(colorBy) {
    const cScale = getColorScale(colorBy, this.props.tree, this.props.sequences);
    let gts = null;
    if (colorBy.slice(0,3) === "gt-" && this.props.sequences.geneLength) {
      gts = parseGenotype(colorBy, this.props.sequences.geneLength);
    }
    cScale.genotype = gts;
    let nodeColorAttr=null;
    let nodeColor=null;
    if (this.props.tree.nodes){
      nodeColorAttr = this.props.tree.nodes.map((n) => this.getTipColorAttribute(n, cScale));
      nodeColor = nodeColorAttr.map((n) => cScale.scale(n));
    }
    return {
      colorScale: cScale,
      nodeColor: nodeColor,
      nodeColorAttr: nodeColorAttr,
    };
  }

  tipVisibility() {
    let upperLimit = +this.state.location.query.dmax;
    let lowerLimit = +this.state.location.query.dmin;
    if (!upperLimit) {
      upperLimit = 1000000000000;
    }
    if (!lowerLimit) {
      lowerLimit = -1000000000000;
    }
    if (this.props.tree.nodes){
      return this.props.tree.nodes.map((d) => (d.attr.num_date >= lowerLimit
                                       && d.attr.num_date < upperLimit)
                                          ? "visible" : "hidden");
    } else {
      return "visible";
    }
  }


  changeRoute(pathname, query) {
    let new_colorData = {};
    //only update colorScales and nodeColors when changed
    if (query.colorBy && (query.colorBy !== this.state.colorScale.colorBy)) {
      new_colorData = this.updateColorScale(query.colorBy);
    }
    this.setState(Object.assign({location:{query, pathname}}, new_colorData));
  }

  /******************************************
   * HOVER EVENTS
   *****************************************/
  determineLegendMatch(selectedLegendItem, nodeAttr, legendBoundsMap) {
    let bool;
    // equates a tip and a legend element
    // exact match is required for categorical qunantities such as genotypes, regions
    // continuous variables need to fall into the interal (lower_bound[leg], leg]
    if (legendBoundsMap) {
      bool = (nodeAttr <= legendBoundsMap.upper_bound[selectedLegendItem]) &&
             (nodeAttr > legendBoundsMap.lower_bound[selectedLegendItem]);
    } else {
      bool = nodeAttr === selectedLegendItem;
    }
    return bool;
  }

  tipRadii() {
    const selItem = this.props.selectedLegendItem;
    if (selItem && this.state.nodeColorAttr){
      const legendMap = this.state.colorScale.continuous
                        ? this.state.colorScale.legendBoundsMap : false;
      return this.state.nodeColorAttr.map((d) => this.determineLegendMatch(selItem, d, legendMap) ? 6 : 3);
    } else if (this.state.nodeColorAttr) {
      return this.state.nodeColorAttr.map((d) => 3);
    } else {
      return null;
    }
  }

  /******************************************
   * RENDER
   *****************************************/
  render() {
    return (
      <div style={{margin: "0px 20px"}}>
        <Header/>
        <Flex
          style={{
            width: "100%"
          }}
          wrap="wrap"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Controls changeRoute={this.changeRoute.bind(this)}
                    location={this.state.location}
                    colorOptions={colorOptions}
                    colorScale={this.state.colorScale}
          />
          <TreeView nodes={this.props.tree.nodes}
                    nodeColorAttr={this.state.nodeColorAttr}
                    nodeColor={this.state.nodeColor}
                    tipRadii={this.tipRadii()}
                    tipVisibility={this.tipVisibility()}
                    layout={this.state.location.query.l || "rectangular"}
                    distanceMeasure={this.state.location.query.m || "div"}
                    datasetGuid={this.props.tree.datasetGuid}
          />
        </Flex>
        <Frequencies/>
        <Entropy/>
        <Map justGotNewDatasetRenderNewMap={false}/>
        <Footer/>
      </div>
    );
  }
}

export default App;
