import React from "react";
import styled from 'styled-components';
import Flex from "../../components/framework/flex";
import { logos } from "./logos";
import { CenterContent } from "./centerContent";

const SplashContent = ({available, browserDimensions, dispatch, errorMessage, changePage}) => {

  const Header = () => (
    <>
      <Flex justifyContent="center">
        <div style={{paddingRight: "40px"}}>
          <h1 style={{textAlign: "center", marginTop: "20px", fontSize: "40px", letterSpacing: "1.5rem"}}>
            {"CoVSeQ"}
          </h1>
          <h2 style={{textAlign: "center", maxWidth: "410px", fontSize: "28px", lineHeight: "32px" }}>
            {"Visualisation interactive des differentes souche de la Covid-19 Séquencées au" +
            " Québec (CoVSeQ)"}
          </h2>
        </div>
        <img
          alt="logo"
          style={{ width: 280 }}
          src={
            require("../../images/VisuelCoronavirus-ms.jpg") // eslint-disable-line global-require
          }
        />
      </Flex>
    </>
  );

  const Intro = () => (
    <p className="paragraph" style={{ textAlign: "center" }}>
      Phylogénie des données du virus Covid-19 du LSPQ combinée à celles
      de <a href="https://www.gisaid.org">GISAID</a>.<br/>
      Ce site est déployé grace à la platforme <a href="https://www.nextstrain.org">nextrain</a>.
    </p>
  );

  const ErrorMessage = () => (
    <CenterContent>
      <div>
        <p style={{color: "rgb(222, 60, 38)", fontWeight: 600, fontSize: "24px"}}>
          {"😱 404, or an error has occured 😱"}
        </p>
        <p style={{color: "rgb(222, 60, 38)", fontWeight: 400, fontSize: "18px"}}>
          {`Details: ${errorMessage}`}
        </p>
        <p style={{fontSize: "16px"}}>
          {"If this keeps happening, or you believe this is a bug, please "}
          <a href={"mailto:hello@nextstrain.org"}>{"get in contact with us."}</a>
        </p>
      </div>
    </CenterContent>
  );

  const ListAvailable = ({type, data}) => (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{fontSize: "26px"}}>
        {`${type} disponibles:`}
      </div>
      {
        data ? (
          <ul style={{ fontSize: 18 }}>
            {data.map((d) => (
              <li key={d.request}>
                <div
                  className="clickable"
                  onClick={() => dispatch(changePage({path: d.request, push: true}))}
                >
                  {d.request}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune</p>
        )
      }
    </div>
  );

  const Footer = () => (
    <CenterContent>
      <a href="https://www.inspq.qc.ca/" target="_blank" rel="noreferrer noopener">
        <img alt="logo" width="200" src={require("../../images/inspq.jpg")}/>
      </a>
      <a href="http://www.mcgillgenomecentre.org/" target="_blank" rel="noreferrer noopener">
        <img alt="logo" width="200" src={require("../../images/Genome_logo.png")}/>
      </a>
      <a href="http://www.computationalgenomics.ca/" target="_blank" rel="noreferrer noopener">
        <img alt="logo" width="200" src={require("../../images/c3g_source.png")}/>
      </a>
      <div>
        <a href="https://www.inspq.qc.ca/lspq" target="_blank" rel="noreferrer noopener">
          <img alt="logo" width="165" src={require("../../images/lspq.jpeg")}/>
        </a>
        <a href="https://www.calculquebec.ca/" target="_blank" rel="noreferrer noopener">
          <img alt="logo" width="165" src={require("../../images/CalculQuebec_logo_medium.png")}/>
        </a>
        <a href="https://www.mcgill.ca/" target="_blank" rel="noreferrer noopener">
          <img alt="logo" width="165" src={require("../../images/Mcgill_Logo.png")}/>
        </a>
        <a href="https://www.umontreal.ca/" target="_blank" rel="noreferrer noopener">
          <img alt="logo" width="165" src={require("../../images/UdeM-officiel-RVB.png")}/>
        </a>
      </div>
    </CenterContent>
  );



  return (
    <div className="static container">
      <Header/>
      {errorMessage ? <ErrorMessage/> : <Intro/>}
      <ListAvailable type="Vues" data={available.datasets}/>
      <Footer/>
    </div>
  );
};

export default SplashContent;
