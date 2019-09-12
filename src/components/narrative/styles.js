import styled from 'styled-components';


export const NarrativeStyles = styled.div`
  
  top: ${(props) => props.narrativeNavBarHeight+"px"};

  p,h1,h2,h3,h4,li {
    color: ${(props) => props.theme.unselectedColor};
  }

  h1 {
    font-weight: 700;
    font-size: 2.4em;
  }

  h2 {
    font-weight: 500;
    font-size: 2.2em;
  }

  h3 {
    font-weight: 500;
    font-size: 2em;
  }

  h4 {
    font-weight: 500;
    font-size: 1.8em;
  }

  div p {
    text-align: justify;
    font-size: 16px;
    margin: 0;
    font-weight: 300;
    line-height: 1.3;
  }

  li {
    font-size: 16px;
    margin: 10px 0px 10px 0px;
    font-weight: 300;
    line-height: 1.3;
  }

  strong {
    font-weight: 500;
    background-color: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  img {
    display: block;
    margin-left: auto;
    margin-right: auto;
    width: 90%;
    padding: 15px 0px 15px 0px;
  }

  figcaption {
    font-style: italic;
    font-size: 1.2em;
    text-align: center;
    margin-bottom: 15px;
  }

  /* NarrativeBlock_0 is the title / header block */
  #NarrativeBlock_0 {
    margin-top: 15px;
  }

  #NarrativeBlock_0 h3 {
    font-weight: 300;
    font-size: 1.8em;
  }

  #NarrativeBlock_0 h4 {
    font-weight: 300;
    font-size: 1.5em;
    margin-left: 20px;
    margin-right: 20px;
    font-style: italic;
    line-height: 1.2;
    text-align: justify;
  }
  
  #NarrativeBlock_0 .explanation {
    text-align: justify;
    font-size: 14px;
    color: ${(props) => props.theme.selectedColor};
    margin: 0;
    margin-bottom: 30px;
    font-weight: 400;
    font-style: italic;
    line-height: 1.2;
  }

  #NarrativeBlock_0 sup {
    font-size: 65%;
    vertical-align: super;
  }

`;


export const OpacityFade = styled.div`
  z-index: 200;
  position: absolute;
  background-image: ${(props) => `linear-gradient(to ${props.position}, rgba(255, 255, 255, 0), ${props.theme.background})`};
  width: 100%;
  height: 30px;
  ${(props) => props.position === "top" && `top: ${props.topHeight}px`};
  ${(props) => props.position === "bottom" && 'bottom: 0px;'};
`;


export const linkStyles = { // would be better to get CSS specificity working
  color: "#5097BA",
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "Lato",
  fontWeight: "400",
  fontSize: "1.8em"
};
