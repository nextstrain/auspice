import React from "react";
import Title from "../framework/title";
import NavBar from "../navBar";
import Flex from "../../components/framework/flex";
import { logos } from "./logos";
import { CenterContent } from "./centerContent";


const formatDataset = (source, fields, dispatch, changePage) => {
  let path = fields.join("/");
  if (source !== "live") {
    path = source + "/" + path;
  }
  return (
    <li key={path}>
      <div
	style={{color: "#5097BA", textDecoration: "none", cursor: "pointer", fontWeight: "400", fontSize: "94%"}}
	onClick={() => dispatch(changePage({path, push: true}))}
      >
	{path}
      </div>
    </li>
  );
};

const listAvailable = (source, available, narratives, browserDimensions, dispatch, changePage) => {
  if (!source) return null;
  if (!available) {
    if (source === "live" || source === "staging") {
      return (
	<CenterContent>
	  <div style={{fontSize: "18px"}}>
	    {`No available ${source} datasets. Try "/local/" for local datasets.`}
	  </div>
	</CenterContent>
      );
    }
    return null;
  }


  let listJSX;
  /* make two columns for wide screens */
  if (browserDimensions.width > 1000) {
    const secondColumnStart = Math.ceil(available.length / 2);
    listJSX = (
      <div style={{display: "flex", flexWrap: "wrap"}}>
	<div style={{flex: "1 50%", minWidth: "0"}}>
	  <ul>
	    {available.slice(0, secondColumnStart).map((data) => formatDataset(source, data, dispatch, changePage))}
	  </ul>
	</div>
	<div style={{flex: "1 50%", minWidth: "0"}}>
	  <ul>
	    {available.slice(secondColumnStart).map((data) => formatDataset(source, data, dispatch, changePage))}
	  </ul>
	</div>
      </div>
    );
  } else {
    listJSX = (
      <ul style={{marginLeft: "-22px"}}>
	{available.map((data) => formatDataset(source, data, dispatch, changePage))}
      </ul>
    );
  }
  return (
    <CenterContent>
      <div>
	<div style={{fontSize: "26px"}}>
	  {`Available ${narratives ? "Narratives" : "Datasets"} for source ${source}`}
	</div>
	{listJSX}
      </div>
    </CenterContent>
  );
};


const SplashContent = ({isMobile, source, available, narratives, browserDimensions, dispatch, errorMessage, changePage}) => (
  <div>
    <NavBar sidebar={false}/>

    <div className="static container">
      <Flex justifyContent="center">
	<Title/>
      </Flex>
      <div className="row">
	<h1 style={{textAlign: "center", marginTop: "-10px", fontSize: "29px"}}> Real-time tracking of virus evolution </h1>
      </div>
      {/* First: either display the error message or the intro-paragraph */}
      {errorMessage ? (
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
      ) : (
	<p style={{maxWidth: 600, marginTop: 0, marginRight: "auto", marginBottom: 20, marginLeft: "auto", textAlign: "center", fontSize: 16, fontWeight: 300, lineHeight: 1.42857143}}>
	  Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data. We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread. Our goal is to aid epidemiological understanding and improve outbreak response.
	</p>
      )}
      {/* Secondly, list the available datasets / narratives */}
      {listAvailable(source, available, narratives, browserDimensions, dispatch, changePage)}
      {/* Finally, the footer (logos) */}
      <CenterContent>
	{logos}
      </CenterContent>

    </div>
  </div>
);

export default SplashContent;
