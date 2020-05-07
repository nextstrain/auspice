import React from "react";
import styled from 'styled-components';

function About() {
  return (
    <div className="static container">
      <h1>CoVSeQ</h1>
      <p className="paragraph">
      CoVSeQ est le regroupement pour le séquançage du SARS-CoV-2 au Québec.
      Nous sommes financé par l initiative RCanGéCO de Génome Canada et par le
      Ministere de la sante et des services sociaux du Québec.
      <br/> --- <br/>
      CoVSeQ is the partnership for Québec SARS-CoV-2 sequencing.
      We receive founding from the CanCOGeN initiative through Genome Canada
      and from the Ministere de la sante et des services sociaux du Québec.

      <h2>Institutions</h2>
      <ul>
      <li> <a href="https://www.inspq.qc.ca/">INSPQ</a></li>
      <li> <a href="http://www.mcgillgenomecentre.org/">McGill Genome Center</a></li>
      <li> <a href="http://www.computationalgenomics.ca/">C3G</a></li>
      <li> <a href="https://www.inspq.qc.ca/lspq">LNSP</a></li>
      <li> <a href="https://www.calculquebec.ca/">Calcul Québec</a></li>
      <li> <a href="https://www.mcgill.ca/">U. McGill</a></li>
      <li> <a href="https://www.umontreal.ca/">UdeM</a></li>
      </ul>
      <h2>Équipe/Team</h2>
    <ul>
    <li>  Michel Roger, medical director LNSP </li>
    <li>  Sandrine Moreira, head of genomics and bioinformatics LNSP </li>
    <li>  Hugues Charest, head of respiratory viruses LNSP </li>
    <li>  Réjean Dion, medical epidemiologist LNSP </li>
    <li>  Eric Fournier LNSP </li>
    <li>  Prof. Ioannis Ragoussis McGill Genome Center </li>
    <li>  Sarah Reiling  McGill Genome Center </li>
    <li>  Jesse Shapiro Assoc. Prof, McGill Genome Center </li>
    <li>  Carmen Lia Murall CNRS </li>
    <li>  Prof. Guillaume Bourque McGill Genome Center & C3G </li>
    <li>  Mathieu Bourguey C3G </li>
    <li>  Paul Stretenowich C3G </li>
    <li>  José-Hector Galvez C3G </li>
    <li>  Pierre-Olivier Quirion C3G & Calcul Québec </li>
      </ul>
      </p>
    </div>

  )
}


export default About;
