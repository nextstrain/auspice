/* eslint-disable global-require */
import React from "react";

export const logos = [
  <a key={1} href="http://www.fredhutch.org/" target="_blank" rel="noreferrer noopener">
    <img alt="logo" width="75" src={require("../../images/fred-hutch-logo-small.png")}/>
  </a>,
  <a key={2} href="http://www.eb.tuebingen.mpg.de/" target="_blank" rel="noreferrer noopener">
    <img alt="logo" width="65" src={require("../../images/max-planck-logo-small.png")}/>
  </a>,
  <a key={3} href="https://www.nih.gov/" target="_blank" rel="noreferrer noopener">
    <img alt="logo" width="52" src={require("../../images/nih-logo-small.png")}/>
  </a>,
  <a key={4} href="https://erc.europa.eu/" target="_blank" rel="noreferrer noopener">
    <img alt="logo" width="60" src={require("../../images/erc-logo-small.png")}/>
  </a>,
  <a key={5} href="https://www.openscienceprize.org/" target="_blank" rel="noreferrer noopener">
    <img alt="logo" width="82" src={require("../../images/osp-logo-small.png")}/>
  </a>,
  <a key={6} href="http://biozentrum.org/" target="_blank" rel="noreferrer noopener">
    <img alt="logo" width="85" src={require("../../images/bz_logo.png")}/>
  </a>
];
