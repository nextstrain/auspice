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
import { isColorByGenotype, decodeColorByGenotype} from "../../util/getGenotype";


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

function clientDetails() {
  return {
    pathname: window.location.pathname,
    origin: forceLinkOutHost || window.location.origin,
  }
}

function TaxoniumLinkOut() {
  const displayName = 'taxonium.org';
  const {pathname, origin} = clientDetails();
  const {distanceMeasure, colorBy, showTreeToo} = useSelector((state) => state.controls)

  // Taxonium should work with all nextstrain URLs which support the {GET, accept JSON} route
  // which should be ~all of them (except authn-required routes, which won't work cross-origin,
  // and which we don't attempt to detect here). Tanglegrams aren't supported.
  if (showTreeToo) {
    return (
      <ButtonContainer key={displayName}>
        <InactiveButton>{displayName}</InactiveButton>
        <ButtonDescription>
          {`The current dataset isn't viewable in taxonium as tanglegrams aren't supported`}
        </ButtonDescription>
      </ButtonContainer>
    )
  }

  return (
    <ButtonContainer key={displayName}>
      <ButtonText href={url()} target="_blank" rel="noreferrer noopener">{displayName}</ButtonText>
      <ButtonDescription>
        Visualise this dataset in Taxonium (<a href='https://docs.taxonium.org/en/latest/' target="_blank" rel="noreferrer noopener">learn more</a>).
      </ButtonDescription>
    </ButtonContainer>
  )

  function taxoniumColoring() {
    if (isColorByGenotype(colorBy)) {
      /* Taxonium syntax looks like 'color={"field":"genotype","pos":485,"gene":"M"}'
      Note that taxonium (I think) does't backfill bases/residues for tips where there
      are no observed mutations w.r.t. the root.
      */
      const subfields = ['"genotype"']; // include quoting as taxonium uses
      const colorInfo = decodeColorByGenotype(colorBy);
      // Multiple mutations (positions) aren't allowed
      if (!colorInfo || colorInfo.positions.length>1) return null;
      // The (integer) position is not enclosed in double quotes
      subfields.push(`"pos":${colorInfo.positions[0]}`);
      // The gene value is optional, without it we use nucleotide ("nt" in taxonium syntax)
      if (colorInfo.aa) subfields.push(`"gene":"${colorInfo.gene}"`);
      // Note that this string will be encoded when converted to a URL
      return `{"field":${subfields.join(',')}}`;
    }
    return `{"field":"meta_${colorBy}"}`;
  }

  function url() {
    const baseUrl = 'https://taxonium.org';
    const queries = {
      treeUrl: `${origin}${pathname}`, // no nextstrain queries
      treeType: 'nextstrain',
      ladderizeTree: 'false', // keep same orientation as Auspice
      xType: distanceMeasure==='num_date' ? 'x_time' : 'x_dist',
    }
    const color = taxoniumColoring();
    if (color) queries.color = color;

    return `${baseUrl}?${Object.entries(queries).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`;
  }
}

function MicrobeTraceLinkOut() {
  const displayName = 'microbetrace.cdc.gov';
  const {pathname, origin} = clientDetails();
  const {showTreeToo} = useSelector((state) => state.controls)
  const {mainTreeNumTips} = useSelector((state) => state.metadata);

  // MicrobeTrace should work similarly to Taxonium (see above)
  // but trees >500 tips are very slow to load (we don't prevent the display of such trees,
  // however we do show a warning)
  if (showTreeToo) {
    return (
      <ButtonContainer key={displayName}>
        <InactiveButton>{displayName}</InactiveButton>
        <ButtonDescription>
          {`The current dataset isn't viewable in MicrobeTrace as tanglegrams aren't supported`}
        </ButtonDescription>
      </ButtonContainer>
    )
  }

  return (
    <ButtonContainer key={displayName}>
      <ButtonText href={url()} target="_blank" rel="noreferrer noopener">{displayName}</ButtonText>
      <ButtonDescription>
        View this data in MicrobeTrace (<a href='https://github.com/CDCgov/MicrobeTrace/wiki' target="_blank" rel="noreferrer noopener">learn more</a>).
        {mainTreeNumTips>500 && (
          <span>
            {` Note that trees with over 500 tips may have trouble loading (this one has ${mainTreeNumTips}).`}
          </span>
        )}
      </ButtonDescription>
    </ButtonContainer>
  )

  function url() {       
    /**
     * As of 2024-04-09, the 'origin' must be nextstrain.org or next.nextstrain.org
     * for these links to work. This means (nextstrain.org) the links coming from heroku
     * review apps will not work.
     */
    const baseUrl = 'https://microbetrace.cdc.gov/MicrobeTrace';
    return `${baseUrl}?url=${encodeURIComponent(`${origin}${pathname}`)}`
  }
}


function NextcladeLinkOut() {
  const displayName = 'nextclade';
  const {pathname, origin} = clientDetails();
  const {showTreeToo} = useSelector((state) => state.controls)
  const {mainTreeNumTips, rootSequence} = useSelector((state) => state.metadata);

  // All datasets which have a root-sequence (either in-line or sidecar) can theoretically work as Nextclade
  // datasets. See <https://github.com/nextstrain/nextclade/pull/1455> for more thorough discussion here.
  // Excessively big trees may be problematic (as Nextclade was designed around smaller reference trees), but
  // exactly what the threshold is isn't known. Here I use a rather ad-hoc tip-count threshold:
  const largeTreeWarning = mainTreeNumTips > 4000;

  if (
    showTreeToo || // Tanglegrams won't work (surprise surprise!)
    !rootSequence  // Root sequence is required for Nextclade
  ) {
    return (
      <ButtonContainer key={displayName}>
        <InactiveButton>{displayName}</InactiveButton>
        <ButtonDescription>
          {`The current tree isn't usable as a Nextclade dataset as ${
            showTreeToo ?
              "tanglegrams aren't supported." :
              "this dataset doesn't have a root-sequence (either within the main JSON or as a sidecar JSON)."
          }`}
        </ButtonDescription>
      </ButtonContainer>
    )
  }

  const url = `https://clades.nextstrain.org?dataset-json-url=${encodeURIComponent(`${origin}${pathname}`)}`
  return (
    <ButtonContainer key={displayName}>
      <ButtonText href={url} target="_blank" rel="noreferrer noopener">{displayName}</ButtonText>
      <ButtonDescription>
        {`Use this tree as a nextclade reference dataset which allows you to add new sequences (via drag-and-drop) and see them placed on the tree.
        Note that manually curated datasets may be better suited to your use case, see `}
        <a href='https://clades.nextstrain.org' target="_blank" rel="noreferrer noopener">clades.nextstrain.org</a>
        {` for all reference datasets or read the `}
        <a href='https://docs.nextstrain.org/projects/nextclade/en/stable/user/nextclade-web/index.html' target="_blank" rel="noreferrer noopener">
          Nextclade Web documentation
        </a>
        {` for more details.`}
        {largeTreeWarning && (
          <span>
            {` Note that large trees such as this may not work in Nextclade!`}
          </span>
        )}
      </ButtonDescription>
    </ButtonContainer>
  )
}

export const LinkOutModalContents = () => {
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

      <NextcladeLinkOut />
      <TaxoniumLinkOut />
      <MicrobeTraceLinkOut />

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