/* DEAD / OLD / NOT YET IMPLEMENTED CODE */



handleZoomEvent(direction) {
  return () => {
    this.state.value.matrix
    console.log(direction)
  }
}
handleChange(value) {
  console.log("handleChange not yet implemented", value)
}
handleClick(event){
  console.log('handleClick not yet implemented', event)
  // console.log('click', event.x, event.y, event.originalEvent);
}

// map animation code to be integrated into componentWillUpdate or other lifecycle later, commented out for big merge -- Colin
if (
  this.state.tree &&
  this.props.layout &&
  this.props.map &&
  this.props.map.animating === true /* the map is in motion, move the bar across the tree */
) {
  this.state.tree.updateTimeBar(
    globals.mapAnimationDurationInMilliseconds,
    this.props.map.progress, /* where the requestAnimationFrame is at the moment */
    this.props.layout
  );
}

infoPanelDismiss() {
  this.setState({clicked: null, hovered: null});
  this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
}

/* NOTE these props were removed from SVG pan-zoom as they led to functions that did
nothing, but they may be useful in the future...
onChangeValue={this.handleChange.bind(this)}
onClick={this.handleClick.bind(this)}
*/
