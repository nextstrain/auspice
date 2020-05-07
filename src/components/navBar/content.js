import React from "react";
import styled from 'styled-components';
import { brandColor } from "../../globalStyles"
import { normalNavBarHeight } from "../../util/globals"

const logoPNG = require("../../images/VisuelCoronavirus-ms.jpg");

const AuspiceNavBarContainer = styled.div`
  color: ${brandColor};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  height: 100%;
`;
const Title = styled.div`
  padding: 0px;
  text-decoration: none;
  color: white;
  font-size: 20px;
  font-weight: 400;
  cursor: pointer;
  letter-spacing: 0.25rem;
  margin-right: 2em;
`;
const LogoLink = styled.a`
  padding: 5px 5px;
  width: 50px;
  cursor: pointer;
`;
const NarrativeTitle = styled.div`
  white-space: nowrap;
  font-size: 1.7rem;
  margin-left: auto;
  padding: 0px 12px;
  float: right;
  color: ${(props) => props.theme.color};
  max-width: ${(props) => props.width - 90}px;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const PageLink = styled.a`
  color: ${brandColor};
  text-decoration: none;
  height: 100%;
  line-height: ${normalNavBarHeight}px;
  font-size: 18px;
  padding: 0 15px;

  &:hover, &:active {
    text-decoration: none;
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:focus {
    text-decoration: none;
  }
`

const links = [
  { name: "Accueil", path: "/" },
  { name: "À propos", path: "/about" },
  { name: "Données", path: "/data" },
  { name: "Méthodes", path: "/methods" },
  { name: "Contact", path: "/contact" },
]

export const AuspiceNavBar = ({narrativeTitle, width, changePage}) => {
  return (
    <AuspiceNavBarContainer>
      <LogoLink href="/">
        <img
          alt="splashPage"
          width="40px"data-infodata-infodata-infodata-infodata-info
          src={logoPNG}
          style={{ borderRadius: '50%' }}
        />
      </LogoLink>
      <Title>COVSEQ</Title>
      {
        narrativeTitle && (
          <NarrativeTitle width={width} href="/">
            {narrativeTitle}
          </NarrativeTitle>
        )
      }

      {
        links.map(link =>
          <PageLink
            key={link.path}
            href={link.path}
            onClick={preventDefault(changePage, { path: link.path })}
          >
            {link.name}
          </PageLink>
        )
      }

    </AuspiceNavBarContainer>
  );
};

function preventDefault(fn, ...args) {
  return (ev) => {
    ev.preventDefault()
    fn(...args)
  }
}
