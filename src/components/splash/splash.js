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
          <h1 style={{textAlign: "center", marginTop: "20px", marginLeft: "20px", fontSize: "72px", letterSpacing: "4rem"}}>
            {"auspice"}
          </h1>
          <h1 style={{textAlign: "center", marginTop: "0px", fontSize: "29px"}}>
            {"Interactive Visualisation of Phylogenomic data"}
          </h1>
        </div>
        <img
          alt="logo"
          width="102"
          src={
            require("../../images/logo-light.svg") // eslint-disable-line global-require
          }
        />
      </Flex>
    </>
  );

  const Intro = () => (
    <p style={{maxWidth: 600, marginTop: 0, marginRight: "auto", marginBottom: 20, marginLeft: "auto", textAlign: "center", fontSize: 16, fontWeight: 300, lineHeight: 1.42857143}}>
      {`
        Auspice is a locally run interactive viewer for phylogeographic and other datasets.
        Auspice can be easily turned into an online web-app, such as nextstrain.org & auspice.us
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
        {`Available ${type}:`}
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
        <ListAvailable type="datasets" data={available.datasets}/>
        <ListAvailable type="narratives" data={available.narratives}/>
        <Footer/>
      </div>
    </>
  );
};

export default SplashContent;
