import styled from 'styled-components';
import React from "react";
import { connect } from "react-redux";
import { calcStyles } from "../main/utils";

/** The escape hatch to get back to debugging.
* This is complicated because auspice uses a lot of absolute CSS positioning, and
* attempting to unravel that is more trouble than it's worth at the moment.
* Currently it's designed to render over the top of the (narrative) sidebar,
* thus obscuring the title etc, which I think is an acceptable MVP. Eventually
* we want lots of options here so maybe a hamburger menu etc is necessary?
* There's plenty of improvements to be made, and perhaps there's even an entirely
* different escape hatch we could use.
*/

const OuterContainer = styled.div`
 min-height: 50px; /* looks good with the nextstrain.org header */
 background-color: #fd8d3c; /* same as "experimental" banner */
 color: white; /* same as "experimental" banner */
 font-size: 24px;
 position: absolute;
 display: flex; /* so we can vertically center the text */
 flex-direction: column;
 justify-content: center;
 z-index: 100;
 top: 0;
 width: ${(props) => props.width+"px"};
 max-width: ${(props) => props.width+"px"};
 overflow-y: auto;
 overflow-x: hidden;
`;

const InnerContainer = styled.div`
  text-align: center;
  cursor: pointer;
`;

@connect((state) => ({
  displayNarrative: state.narrative.display,
  browserDimensions: state.browserDimensions.browserDimensions
}))
class NarrativeViewHeader extends React.Component {
  render() {
    /* mobile display doesn't work well with this component, but then the whole editing functionality doesn't
    play nicely with mobile (and I don't really see how it can...) */
    const {sidebarWidth} = calcStyles(this.props.browserDimensions, this.props.displayNarrative, true, false);
    // todo - can we surround this with an error boundary?
    return (
      <OuterContainer width={sidebarWidth}>
        <InnerContainer style={{cursor: "pointer"}} onClick={() => this.props.setDisplayNarrative(false)}>
          Return to debugging window
        </InnerContainer>
      </OuterContainer>
    );
  }
}

export default NarrativeViewHeader;
