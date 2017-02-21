/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import TitleBar from "../components/framework/title-bar";
import Title from "../components/framework/title";
import { headerFont } from "../globalStyles";
import Flex from "../components/framework/flex";
// import Card from "./framework/card";

const generateCard = (title, imgRequired, to) => (
  <div style={{
    backgroundColor: "#FFFFFF",
    // marginLeft: 10,
    // marginRight: 10,
    // marginTop: 5,
    // marginBottom: 5,
    padding: 0,
    overflow: "hidden",
    position: "relative",
    // boxSizing: "content-box"
  }}>
    <div style={{
      boxShadow: "3px 3px 4px 1px rgba(215,215,215,0.85)",
      borderRadius: 2,
      marginLeft: 10,
      marginRight: 10,
      marginTop: 5,
      marginBottom: 5
      // display: "flex",
      // justifyContent: "center",
      // alignItems: "center",
      // overflow: "hidden"
    }}>
      <img
        style={{
          objectFit: "cover",
          width: "100%"
        }}
        src={imgRequired}
      />
      <Link to={to}>
        <span style={{
          fontFamily: headerFont,
          fontWeight: 500,
          fontSize: 28,
          position: "absolute",
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 20,
          paddingRight: 40,
          top: "40px",
          left: "20px",
          // width: "100%",
          color: "white",
          background: "rgba(0, 0, 0, 0.7)"
        }}>
          {title}
        </span>
      </Link>
    </div>
  </div>
);

const Splash = () => {

  return(
    <g>
      <TitleBar titleHidden={true}/>

      <div className="static container">

  			<div className="bigspacer"></div>

  			<div className="row">
          <div className="col-md-1"/>
  				<div className="col-md-6">
            <Title/>
            <p/>
            <h2>
            Real-time tracking of virus evolution
            </h2>

            This website aims to provide a real-time snapshot of evolving virus populations to aid epidemiological understanding and improve outbreak response

            <div className={"line"}/>

            <Link to="/about">
              More detailed information about Nextstrain
            </Link>
            <p/>
            <Link to="/methods">
              How we process the data
            </Link>
            <p/>
            <Link to="/help">
              How to use Nextstrain
            </Link>

            <div className={"line"}/>
					</div>
          <div className="col-md-5"/>
				</div>



        {/* THE CLICKABLE CARDS
          images styalized in lunapic witht he grey filter
          https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/197-Zika_Virus-ZikaVirus.tif/lossy-page1-800px-197-Zika_Virus-ZikaVirus.tif.jpg
          http://www.cidresearch.org/uploads/12/10/ebola_virus_particles_budding_VERO_E6_cell_blue_yellow_NIAID.jpg
          http://cdn1.bostonmagazine.com/wp-content/uploads/2013/10/flu-virus-main.jpg
        */}

        <div className="row">
          <div className="col-md-1"/>
          <div className="col-md-10">
            <div className="row">
      				<div className="col-sm-4">
                {generateCard("Ebola", require("../images/ebola.png"), "/ebola")}
              </div>
              <div className="col-sm-4">
                {generateCard("Zika", require("../images/zika.png"), "/zika")}
              </div>
              <div className="col-sm-4">
                {generateCard("Influenza", require("../images/influenza.png"), "/flu")}
              </div>
            </div>
          </div>
          <div className="col-md-1"/>
        </div>

      </div>

    </g>
  );
};

export default Splash;
