import React from "react";
import styled from 'styled-components';

function Contact() {
  return (
    <div className="static container">
      <h1>Contact</h1>

      <p className="paragraph">
        Phylogénie des données du virus Covid-19 du LSPQ combinée à celles
        de <a href="https://www.gisaid.org">GISAID</a>.<br/>
        Ce site est déployé grace à la platforme <a href="https://www.nextstrain.org">nextrain</a>.
      </p>
    </div>
  )
}

export default Contact;
