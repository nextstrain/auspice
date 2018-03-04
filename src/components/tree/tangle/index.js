import { connect } from "react-redux";
import React from "react";
import { select } from "d3-selection";

const getBounds = () => {
  const treeBounds = document.getElementById("treeSVG").getBoundingClientRect();
  const treeTooBounds = document.getElementById("treeTooSVG").getBoundingClientRect();
  console.log(treeBounds, treeTooBounds)

}

@connect((state) => {
  return {
    treeLoaded: state.tree.loaded,
    treeTooLoaded: state.treeToo.loaded,
    strokeColors: state.tree.nodeColors,
    strokeVersion: state.tree.nodeColorsVersion,
    treeNodes: state.tree.nodes,
    treeTooNodes: state.treeToo.nodes
  };
})
class Tangle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {x: undefined, y: undefined, width: undefined, height: undefined, lookup: undefined};
  }
  updateBounds() {
    // const treeBounds = document.getElementById("treeSVG").getBoundingClientRect();
    // const treeTooBounds = document.getElementById("treeTooSVG").getBoundingClientRect();
    const [x, y, width, height] = [0, 150, 1200, 620];
    if (this.state.x !== x || this.state.y !== y || this.state.width !== width || this.state.height !== height) {
      select(this.d3ref)
	.style("width", width)
	.style("height", height);

      this.setState({x, y, width, height});
      return {x, y, width, height};
    }
    return this.state;
  }
  constructNodeMap(nodes, nodesToo) {
    console.log("constructNodeMap");
    const tipsTooStrainIndexMap = {};
    for (let i = 0; i < nodesToo.length; i++) {
      if (!nodesToo[i].hasChildren) {
	// if (nodesToo[i].strain!=="A/Fujian/5/2014") continue;
	tipsTooStrainIndexMap[nodesToo[i].strain] = i;
      }
    }
    const lookup = []; // each entry is [idxInNodes, idxInNodesToo]
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].hasChildren && tipsTooStrainIndexMap[nodes[i].strain]) {
	lookup.push([i, tipsTooStrainIndexMap[nodes[i].strain]]);
      }
    }
    return lookup;
  }
  drawLines(props, lookup, bounds) {
    console.log("drawing lines")
    console.log("lookup:", lookup)
    console.log(props.treeTooNodes)
    console.log(select(this.d3ref))
    select(this.d3ref).selectAll(".tangleLine").remove();

    const makeD = (idxs) => {
      const tip1 = props.treeNodes[idxs[0]].shell;
      const tip2 = props.treeTooNodes[idxs[1]].shell;
      // console.log("tip1:", tip1.xTip, tip1.yTip)
      // console.log("tip2:", tip2.xTip, tip2.yTip)
      return `M ${tip1.xTip + 25},${tip1.yTip} L ${bounds.width / 2 + tip2.xTip + 50},${tip2.yTip}`;
    };

    select(this.d3ref)
      .append("g")
      .selectAll(".tangleLine")
      .data(lookup)
      .enter()
      .append("path")
      .attr("class", "tangleLine")
      .attr("d", makeD)
      .attr("stroke-width", 0.25)
      .attr("stroke", (idxs) => props.strokeColors[idxs[0]]);

  }
  componentDidMount() {
    if (this.props.treeLoaded && this.props.treeTooLoaded) {
      const bounds = this.updateBounds();
      const lookup = this.constructNodeMap(this.props.treeNodes, this.props.treeTooNodes);
      this.drawLines(this.props, lookup, bounds);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.treeLoaded && nextProps.treeTooLoaded && (!this.props.treeLoaded || !this.props.treeTooLoaded)) {
      const bounds = this.updateBounds();
      const lookup = this.constructNodeMap(nextProps.treeNodes, nextProps.treeTooNodes);
      this.drawLines(nextProps, lookup, bounds);
    } else if (this.props.strokeVersion !== nextProps.strokeVersion) {
      const lookup = this.constructNodeMap(nextProps.treeNodes, nextProps.treeTooNodes);
      this.drawLines(nextProps, lookup, this.state);
    }
  }
  /* CDU is used to update phylotree when the SVG size _has_ changed (and this is why it's in CDU not CWRP) */
  componentDidUpdate(prevProps) {
    if ( // the tree exists AND the width has changed (browser resize, sidebar open/close...)
      this.state.tree &&
      (this.props.width !== prevProps.width || this.props.height !== prevProps.height)
    ) {
      this.updateBounds();
      console.log("browser change -> update")
    }
  }
  render() {
    console.log("tangle render");
    return (
      <div style={{position: "absolute", left: this.state.x, top: this.state.y, zIndex: 2000, pointerEvents: "none"}}>
	<svg
	  style={{cursor: "default", zIndex: 900}}
	  ref={(c) => {this.d3ref = c;}}
	/>
      </div>
    );
  }
}

export default Tangle;
