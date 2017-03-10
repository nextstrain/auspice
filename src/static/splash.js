/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import TitleBar from "../components/framework/title-bar";
import Title from "../components/framework/title";
import { headerFont, materialButtonOutline } from "../globalStyles";
import Flex from "../components/framework/flex";
import { analyticsNewPage, triggerOutboundEvent } from "../util/googleAnalytics";
import { generateLogos } from "./helpers/logos";
import { tweets } from "./helpers/tweets";

const styles = {
  cardMainText: {
    fontFamily: headerFont,
    fontWeight: 500,
    fontSize: window.innerWidth > 1200 ? 28 : 20,
    position: "absolute",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    top: "40px",
    left: "20px",
    color: "white",
    background: "rgba(0, 0, 0, 0.7)"
  },
  cardSubText: {
    color: "white",
    fontStyle: "italic",
    fontSize: window.innerWidth > 1200 ? 28 : 12,
    fontWeight: 400,
    lineHeight: 0.3,
    textAlign: "right"
  },
  cardOuterDiv: {
    backgroundColor: "#FFFFFF",
    // marginLeft: 10,
    // marginRight: 10,
    // marginTop: 5,
    // marginBottom: 5,
    padding: 0,
    overflow: "hidden",
    position: "relative"
    // boxSizing: "content-box"
  },
  cardInnerDiv: {
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
  },
  cardImg: {
    objectFit: "cover",
    width: "100%"
  },
  introText: {
    maxWidth: 600,
    marginTop: 0,
    marginRight: "auto",
    marginBottom: 20,
    marginLeft: "auto",
    textAlign: "center",
    fontSize: 16,
    fontWeight: 300,
    lineHeight: 1.42857143
  }
};

const generateCard = (title, imgRequired, to, outboundLink) => {
  function imgAndText() {
    return (
      <g>
        <img style={styles.cardImg} src={imgRequired}/>
        <span style={styles.cardMainText}>
          {title[0]}
          {title.length === 2 ? <div style={styles.cardSubText}>{title[1]}</div> : null}
        </span>
      </g>
    );
  }
  if (outboundLink) { // use <a> and trigger google analytics
    return (
      <div style={styles.cardOuterDiv}>
        <div style={styles.cardInnerDiv}>
          <a href={to} target="_blank" onClick={() => triggerOutboundEvent(to)}>
            {imgAndText()}
          </a>
        </div>
      </div>
    );
  } else { // use <Link> and let React Router sort it out
    return (
      <div style={styles.cardOuterDiv}>
        <div style={styles.cardInnerDiv}>
          <Link to={to}>
            {imgAndText()}
          </Link>
        </div>
      </div>
    );
  }
};

class Splash extends React.Component {
  componentWillMount() {
    analyticsNewPage();
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);
  }
  render() {
    return(
      <div>
        <TitleBar logoHidden={true} titleHidden={true}/>

        <div className="static container">
          <Flex justifyContent="center">
            <Title/>
          </Flex>
          <div className="row">
            <h1 style={{textAlign: "center"}}> Real-time tracking of virus evolution </h1>
          </div>

    			<p style={styles.introText}>
            Nextstrain is an open-source project to harness the scientific and public health potential of pathogen genome data. We provide a continually-updated view of publicly available data with powerful analytics and visualizations showing pathogen evolution and epidemic spread. Our goal is to aid epidemiological understanding and improve outbreak response.
          </p>

          <Flex justifyContent="center">
            <Link to="/about">
              <button style={materialButtonOutline}>
                Read More
              </button>
            </Link>
          </Flex>

          {/* THE CLICKABLE CARDS - see about page for sources & attribution */}

          <div className="bigspacer"></div>

          <div className="row">
            <h1 style={{textAlign: "center"}}>Explore viruses</h1>
            <div className="col-md-1"/>
            <div className="col-md-10">
              <div className="row">
        				<div className="col-sm-4">
                  {generateCard(["Ebola"], require("../images/ebola.png"), "/ebola", false)}
                </div>
                <div className="col-sm-4">
                  {generateCard(["Zika"], require("../images/zika.png"), "/zika", false)}
                </div>
                <div className="col-sm-4">
                  {generateCard(["Avian Influenza", "A/H7N9"], require("../images/H7N9.png"), "/flu/H7N9", false)}
                </div>
                <div className="col-sm-4">
                  {generateCard(["Seasonal Influenza", "(uses nextflu.org)"], require("../images/influenza.png"), "http://nextflu.org", true)}
                </div>
              </div>
            </div>
            <div className="col-md-1"/>
          </div>

          {/* SOCIAL MEDIA AKA TWITTER */}

          <div className="row" >
            <h1 style={{textAlign: "center"}}>From the community</h1>
          </div>

          {tweets()}

          {/* FOOTER / LOGOS */}

          <div className="bigspacer"></div>
          <div className="row">
            <div className="col-md-1"/>
            <div className="col-md-10">
              <div className="line"></div>
              <Flex wrap="wrap" style={{marginTop: 20, justifyContent: "space-around"}}>
                {generateLogos}
              </Flex>
            </div>
            <div className="col-md-1"/>
          </div>

        </div>
      </div>
    );
  }
}

export default Splash;

// <blockquote className="twitter-tweet"><p lang="en" dir="ltr"><a href="http://t.co/zTlTC5bEJP">http://t.co/zTlTC5bEJP</a> Ebola virus evolution and nanopore sequencing at <a href="https://twitter.com/unibirmingham">@unibirmingham</a> Biosciences open day today <a href="http://t.co/Bnmw5qREuA">pic.twitter.com/Bnmw5qREuA</a></p>&mdash; Nick Loman (@pathogenomenick) <a href="https://twitter.com/pathogenomenick/status/655313321424457728">October 17, 2015</a></blockquote>
// <blockquote className="twitter-tweet"><p lang="en" dir="ltr">Vote for best Taylor Swift project: <a href="https://t.co/LFLPqF9k0x">https://t.co/LFLPqF9k0x</a> My favorite: <a href="https://t.co/pIvv9jAY6z">https://t.co/pIvv9jAY6z</a> from <a href="https://twitter.com/richardneher">@richardneher</a>… <a href="https://t.co/GrCLAURNJ5">https://t.co/GrCLAURNJ5</a></p>&mdash; OpenDataTaylorSwift (@t_s_institute) <a href="https://twitter.com/t_s_institute/status/804984202550804480">December 3, 2016</a></blockquote>
