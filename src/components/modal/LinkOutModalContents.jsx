/**
 * This page defines a number of link-outs, which will appear in a modal when requested.
 * They are currently developed exclusively for Auspice as used within Nextstrain.org
 * and are opt-in - i.e. they must be enabled by setting (undocumented) extension parameters.
 * If the need arises we can make these fully extendable and shift their definitions into
 * the extension architecture.
 */

import React from "react";
import styled from 'styled-components';
import { useSelector } from "react-redux";
import { infoPanelStyles } from "../../globalStyles";
import { dataFont, lighterGrey} from "../../globalStyles";
import { hasExtension, getExtension } from "../../util/extensions";


/**
 * The following value is useful for development purposes as we'll not show any
 * link-outs on localhost (because external sites can't access it!). Setting to
 * a string such as "https://nextstrain.org" will allow testing the links. Note
 * that if this is set we won't check for the relevant extension parameter - i.e.
 * the modal will always be available.
 */
let forceLinkOutHost = false; // eslint-disable-line prefer-const
// forceLinkOutHost = "https://nextstrain.org"; // uncomment for dev purposes

const ButtonText = styled.a`
  border: 1px solid ${lighterGrey};
  border-radius: 4px;
  cursor: pointer;
  padding: 4px 7px;
  margin-right: 10px;
  font-family: ${dataFont};
  background-color: rgba(0,0,0,0);
  color: white !important;
  font-weight: 400;
  text-decoration: none !important;
  font-size: 16px;
  flex-shrink: 0;
  & :hover {
    background-color: ${(props) => props.theme.selectedColor};
  }
`

const InactiveButton = styled.span`
  border: 1px solid ${lighterGrey};
  border-radius: 4px;
  cursor: auto;
  padding: 4px 7px;
  margin-right: 10px;
  font-family: ${dataFont};
  background-color: rgba(0,0,0,0);
  color: white;
  font-weight: 400;
  text-decoration: line-through !important;
  font-size: 16px;
  flex-shrink: 0;
`

const ButtonDescription = styled.span`
  display: inline-block;
  font-style: italic;
  font-size: 14px;
  color: white;
`

const ButtonContainer = styled.div`
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
`

const data = ({distanceMeasure, colorBy, mainTreeNumTips, tangle}) => {
  return []
}

export const LinkOutModalContents = () => {
  const {distanceMeasure, colorBy, showTreeToo} = useSelector((state) => state.controls)
  const {mainTreeNumTips} = useSelector((state) => state.metadata);
  const linkouts = data({distanceMeasure, colorBy, mainTreeNumTips, tangle: !!showTreeToo});

  return (
    <>
      <div style={infoPanelStyles.modalSubheading}>
        View this dataset on other platforms:
      </div>

      <div style={infoPanelStyles.break}/>

      <p>
        Clicking on the following links will take you to an external site which will attempt to
        load the underlying data JSON which you are currently viewing.
        These sites are not part of Nextstrain and as such are not under our control, but we
        highly encourage interoperability across platforms like these. 
      </p>

      <div style={{paddingTop: '10px'}}/>

      {linkouts.map((d) => (
        <ButtonContainer key={d.name}>
          {d.valid() ? (
            <ButtonText href={d.url()} target="_blank" rel="noreferrer noopener">{d.name}</ButtonText>
          ) : (
            <InactiveButton>{d.name}</InactiveButton>
          )}
          <ButtonDescription>{d.description()}</ButtonDescription>
        </ButtonContainer>
      ))}

      {linkouts.length===0 && (
        <div>{`The current data source and/or view settings aren't compatible with any platforms. Sorry!`}</div>
      )}

    </>
  );
}


export const canShowLinkOuts = () => {
  if (forceLinkOutHost) {
    // eslint-disable-next-line no-console
    console.log("Enabling link-out modal because 'forceLinkOutHost' is set")
    return true;
  }
  if (!hasExtension('linkOutModal') || !getExtension('linkOutModal')) {
    return false;
  }
  if (window.location.hostname==='localhost') {
    console.warn("Link-out modal requested but you are running on localhost so the links will not work")
  }
  return true;
}