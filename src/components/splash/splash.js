import React from "react";
import styled from 'styled-components';
import NavBar from "../navBar";
import Flex from "../../components/framework/flex";
import { logos } from "./logos";
import { CenterContent } from "./centerContent";


const getNumColumns = (width) => width > 1000 ? 3 : width > 750 ? 2 : 1;

const ColumnList = styled.ul`
  -moz-column-count: ${(props) => getNumColumns(props.width)};
  -moz-column-gap: 20px;
  -webkit-column-count: ${(props) => getNumColumns(props.width)};
  -webkit-column-gap: 20px;
  column-count: ${(props) => getNumColumns(props.width)};
  column-gap: 20px;
`;

const formatDataset = (requestPath, dispatch, changePage) => {
  return (
    <li key={requestPath}>
      <div
        style={{color: "#5097BA", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "94%"}}
        onClick={() => dispatch(changePage({path: requestPath, push: true}))}
      >
        {requestPath}
      </div>
    </li>
  );
};

const SplashContent = ({available, browserDimensions, dispatch, errorMessage, changePage}) => {

  const Header = () => (
    <>
      <Flex justifyContent="center">
        <div style={{paddingRight: "40px"}}>
          <h1 style={{textAlign: "center", marginTop: "20px", marginLeft: "20px", fontSize: "40px", letterSpacing: "2rem"}}>
            {"CoVSeQ"}
          </h1>
          <h1 style={{textAlign: "center", marginTop: "0px", fontSize: "29px"}}>
            {"Visualisation interactive des differentes souche de la Covid-19 Séquencées au" +
            " Québec (CoVSeQ)"}
          </h1>
        </div>
        <img
          alt="logo"
          width="u02"
          src={
            require("../../images/VisuelCoronavirus-ms.jpg") // eslint-disable-line global-require
          }
        />
      </Flex>
    </>
  );

  const Intro = () => (
    <p style={{maxWidth: 600, marginTop: 0, marginRight: "auto", marginBottom: 20, marginLeft: "auto", textAlign: "left", fontSize: 16, fontWeight: 300, lineHeight: 1.42857143}}>
      {`
        Phylogénie des données du virus Covid-19 du LSPQ combinée à celles de GISAID (www.gisaid.org). Ce site est déployé grace à la platforme nextrain (www.nextstrain.org)
      `}
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
    <>
      <div style={{fontSize: "26px"}}>
        {`${type} Disponibles:`}
      </div>
      {
        data ? (
          <div style={{display: "flex", flexWrap: "wrap"}}>
            <div style={{flex: "1 50%", minWidth: "0"}}>
              <ColumnList width={browserDimensions.width}>
                {data.map((d) => formatDataset(d.request, dispatch, changePage))}
              </ColumnList>
            </div>
          </div>
        ) : (
          <p>
            none found
          </p>
        )
      }
    </>
  );

  const Footer = () => (
    <CenterContent>
      {logos}
    </CenterContent>
  );

  return (
    <>
      <NavBar sidebar={false}/>
      <div className="static container">
        <Header/>
        {errorMessage ? <ErrorMessage/> : <Intro/>}
        <ListAvailable type="Vues" data={available.datasets}/>
        <Footer/>
      </div>
    </>
  );
};

export default SplashContent;
