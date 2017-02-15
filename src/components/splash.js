/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import TitleBar from "./framework/title-bar";
import { textStyles, headerFont } from "../globalStyles";
import Flex from "./framework/flex";
// import Card from "./framework/card";

const generateCard = (title, imgRequired, to) => (
  <div style={{
    backgroundColor: "#FFFFFF",
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    marginBottom: 5,
    boxShadow: "2px 2px 4px 1px rgba(215,215,215,0.85)",
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
    flex: "0 0 20%"
  }}>
    <img
      style={{flexShrink: 0, minWidth: "100%", minHeight: "100%"}}
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
        top: "20px",
        left: "0px",
        // width: "100%",
        color: "white",
        background: "rgba(0, 0, 0, 0.7)"
      }}>
        {title}
      </span>
    </Link>
  </div>
);

@connect()
class Splash extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const styles = textStyles;
    return(
      <div>
        <TitleBar/>
        <Flex style={styles.main}>
          <div style={{flex: 1 }}/>
          <div style={{flex: 3 }}>
            <div style={[styles.headers, styles.title]}>
              Real-time tracking of virus evolution
            </div>
            <p/>
            <div style={styles.text}>Brief introduction?</div>
            <div style={styles.line}/>

            <Link style={styles.link} to="/about">
              More detailed information about Nextstrain
            </Link>
            <p/>
            <Link style={styles.link} to="/methods">
              How we process the data
            </Link>
            <p/>
            <Link style={styles.link} to="/help">
              How to use Nextstrain
            </Link>

            <div style={styles.line}/>

          </div>
          <div style={{flex: 1 }}/>
        </Flex>

        {/* THE CLICKABLE CARDS
          images styalized in lunapic witht he grey filter
          https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/197-Zika_Virus-ZikaVirus.tif/lossy-page1-800px-197-Zika_Virus-ZikaVirus.tif.jpg
          http://www.cidresearch.org/uploads/12/10/ebola_virus_particles_budding_VERO_E6_cell_blue_yellow_NIAID.jpg
          http://cdn1.bostonmagazine.com/wp-content/uploads/2013/10/flu-virus-main.jpg
          */}
        <Flex style={{wrap: "wrap"}}>
          {generateCard("Ebola", require("../images/ebola.png"), "/ebola")}
          {generateCard("Zika", require("../images/zika.png"), "/zika")}
          {generateCard("Influenza", require("../images/influenza.png"), "/flu")}
        </Flex>

      </div>
    );
  }
}

export default Splash;
