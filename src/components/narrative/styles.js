import styled, {css} from 'styled-components';

export const NarrativeStyles = styled.div`

  top: ${(props) => props.narrativeNavBarHeight+"px"};
  font-weight: 300;

  /* Use media queries to modify the font size so things look ok
  on a range of screen sizes */
  font-size: 14px;
  line-height: 1.3;
  @media (max-width: 1080px) {
    font-size: 13px;
    line-height: 1.1;
  }

  p, h1, h2, h3, h4, li, table {
    color: ${(props) => props.theme.unselectedColor};
  }
  table, th, td {
    border: 1px solid;
  }
  td, th {
    padding: 3px;
  }

  h1 {
    font-weight: 700;
    font-size: 2em;
    margin-bottom: 30px;
    @media (max-width: 1080px) {
      font-size: 1.8em;
      margin-bottom: 10px;
    }
  }

  h2 {
    font-weight: 500;
    font-size: 1.8em;
    @media (max-width: 1080px) {
      font-size: 1.6em;
    }
  }

  h3 {
    font-weight: 500;
    font-size: 1.6em;
    @media (max-width: 1080px) {
      font-size: 1.4em;
    }
  }

  h4 {
    font-weight: 500;
    font-size: 1.4em;
    @media (max-width: 1080px) {
      font-size: 1.2em;
    }
  }

  div p {
    text-align: justify;
    margin: 10px 0px;
    font-weight: inherit;
    line-height: inherit;
  }

  li {
    margin: 10px 0px 10px 0px;
    font-weight: inherit;
    line-height: inherit;
  }

  table {
    width: 100%;
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
    font-size: 0.9em;
    text-align: center;
    margin-bottom: 15px;
  }

  /* NarrativeBlock_0 is the title / header block */
  #NarrativeBlock_0 {
    margin-top: 15px;
  }

  /* front page authors + created */
  #NarrativeBlock_0 h3 {
    font-weight: inherit;
    font-size: 1.2em;
  }

  /* The abstract */
  #NarrativeBlock_0 h4 {
    text-align: justify;
    font-size: inherit;
    margin: 0;
    margin-bottom: 30px;
    font-weight: inherit;
    font-style: italic;
    line-height: inherit;
  }

  /* The hardcoded text at the top of the first narrative page
  "Explore the content by scrolling the left ha..." */
  #NarrativeBlock_0 .explanation {
    text-align: justify;
    font-size: inherit;
    color: ${(props) => props.theme.selectedColor};
    margin: 0;
    margin-bottom: 30px;
    font-weight: inherit;
    font-style: italic;
    line-height: inherit;
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
  fontFamily: `"Lato", "Helvetica Neue", "Helvetica", "sans-serif"`,
  fontWeight: "400",
  fontSize: "1.8em"
};

export const ProgressBar = styled.div`
  width: 100%;
  background-color: inherit;
  box-shadow: 0px -3px 3px -3px rgba(0, 0, 0, 0.2) inset;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
`;

export const ProgressButton = styled.div`
  background: #74a9cf;
  border-radius: 50%;
  cursor: pointer;
  transition: transform .1s;

  // BEGIN: mitigate ie flexbug-15: https://github.com/philipwalton/flexbugs#flexbug-15
  align-self: center;
  margin: auto;
  // END mitigate ie flexbug-15

  &:hover {
    transform: scale(3);
  }
`;

const baseBannerStyles = css`
  width: 100%;
  color: white;
  font-size: 24px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const EndOfNarrative = styled.div`
  text-align: center;
  display: grid;
  grid-template-rows: 1fr;
  grid-row-gap: 10px;
`;

export const MobileBannerTop = styled.nav`
  ${baseBannerStyles}
  top: 0;
  height: ${(props) => props.height}px;
  background-color: #E67F2C;
`;

export const MobileBannerBottom = styled.nav`
  ${baseBannerStyles}
  bottom: 0;
  height: ${(props) => props.height}px;
  background-color: #65B0A4;
`;

export const MobileContentContainer = styled.div`
  min-height: ${(props) => props.height}px;
  max-height: ${(props) => props.height}px;
  overflow-y: scroll;
  color: ${(props) => props.theme.unselectedColor};
  background-color: ${(props) => props.theme.background};
  font-weight: 300;
  font-size: 14px;
  line-height: 1.3;
`;
