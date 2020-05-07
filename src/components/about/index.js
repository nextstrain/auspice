import React from "react";
import styled from 'styled-components';
function About() {
  return (
    <div className="static container">
      <h1>CoVSeQ</h1>
        <p className="paragraph">
         CoVSeQ est le regroupement pour le séquençage du SARS-CoV-2 au Québec.
          Nous sommes financé par l'initiative RCanGéCO de Génome Canada et par
          le Ministère de la santé et des services sociaux du Québec.

          <br/> --- <br/>
          CoVSeQ is the partnership for Québec SARS-CoV-2 sequencing. We receive
           funding from the CanCOGeN initiative through Genome Canada and from
            the Ministere de la santé et des services sociaux du Québec.

        </p>

      <p className="paragraph">
      Institutions
      <ul>
      <li> <a href="https://www.inspq.qc.ca/">INSPQ</a></li>
      <li> <a href="http://www.mcgillgenomecentre.org/">McGill Genome Center</a></li>
      <li> <a href="http://www.computationalgenomics.ca/">C3G</a></li>
      <li> <a href="https://www.inspq.qc.ca/lspq">LNSP</a></li>
      <li> <a href="https://www.calculquebec.ca/">Calcul Québec</a></li>
      <li> <a href="https://www.mcgill.ca/">U. McGill</a></li>
      <li> <a href="https://www.umontreal.ca/">UdeM</a></li>
      </ul>
      Équipe/Team
    <h2>LNSP</h2>
    <ul>
      <li>  Michel Roger, Medical director  </li>
      <li>  Sandrine Moreira, Head of genomics and bioinformatics</li>
      <li>  Hugues Charest, Head of respiratory viruses</li>
      <li>  Réjean Dion, Medical epidemiologist</li>
      <li>  Eric Fournier </li>
    </ul>
    <h2>McGIll Genome Center</h2>
    <ul>
      <li>  Prof. Ioannis Ragoussis, Head of Genome Science </li>
      <li>  Sarah Reiling, Research associate </li>
      <li>  Jesse Shapiro, Assoc. Prof </li>
      <li>  Carmen Lia Murall Post Doc </li>
      <li>  Prof. Guillaume Bourque, Head of Bioinformatics </li>
    </ul>
    <h2>C3G</h2>
    <ul>
      <li>  Prof. Guillaume Bourque, Director </li>
      <li>  Mathieu Bourgey, Bioinformatics manager - Technological development team </li>
      <li>  Paul Stretenowich, Bioinformatics consultant </li>
      <li>  José-Hector Galvez, Bioinformatics specialist </li>
      <li>  Pierre-Olivier Quirion, HPC specialist  </li>
    </ul>
    <h2>Calcul Québec</h2>
    <ul>
      <li>  Pierre-Olivier Quirion, HPC analyst </li>
    </ul>
      </p>
    </div>

  )
}


export default About;
