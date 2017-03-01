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
// import Card from "./framework/card";

const styles = {
  cardMainText: {
    fontFamily: headerFont,
    fontWeight: 500,
    fontSize: 28,
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
    fontSize: 16,
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


/* helper / generating functions */
const generateLogos = [
  <a key={1} href="http://www.fredhutch.org/" target="_blank">
    <img width="75" src={require("../images/fred-hutch-logo-small.png")}/>
  </a>,
  <a key={2} href="http://www.eb.tuebingen.mpg.de/" target="_blank">
    <img width="65" src={require("../images/max-planck-logo-small.png")}/>
  </a>,
  <a key={3} href="https://www.nih.gov/" target="_blank">
    <img width="52" src={require("../images/nih-logo-small.png")}/>
  </a>,
  <a key={4} href="https://erc.europa.eu/" target="_blank">
    <img width="60" src={require("../images/erc-logo-small.png")}/>
  </a>,
  <a key={5} href="https://www.openscienceprize.org/" target="_blank">
    <img width="82" src={require("../images/osp-logo-small.png")}/>
  </a>,
  <a key={6} href="http://biozentrum.org/" target="_blank">
    <img width="85" src={require("../images/bz_logo.png")}/>
  </a>
];


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

    			<p style={{
              maxWidth: 600,
              margin: "0px auto 20px auto",
              textAlign: "center",
              fontSize: 16,
              fontWeight: 300,
              lineHeight: 1.42857143
            }}>
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
                  {generateCard(["Ebola"], require("../images/ebola.png"), "/ebola?c=division&r=division", false)}
                </div>
                <div className="col-sm-4">
                  {generateCard(["Zika"], require("../images/zika.png"), "/zika", false)}
                </div>
                <div className="col-sm-4">
                  {generateCard(["Influenza", "(uses nextflu.org)"], require("../images/influenza.png"), "http://nextflu.org", true)}
                </div>
              </div>
            </div>
            <div className="col-md-1"/>
          </div>

          {/* SOCIAL MEDIA AKA TWITTER */}

          <div className="row" >
            <h1 style={{textAlign: "center"}}>From the community</h1>
          </div>
          <Flex wrap="wrap" direction="row" alignItems="flex-start">

            <div style={{marginRight:30, marginLeft: 30}}>

              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">Here&#39;s NextStrain from <a href="https://twitter.com/richardneher">@richardneher</a> <a href="https://twitter.com/trvrb">@trvrb</a> used in Sierra Leone for realtime Ebola transmission. A powerful tool ! <a href="https://t.co/fN5sjzUWkL">pic.twitter.com/fN5sjzUWkL</a></p>&mdash; Matthew Cotten (@mlcotten13) <a href="https://twitter.com/mlcotten13/status/730892338394959872">May 12, 2016</a></blockquote>
              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">Vote for best open data project: <a href="https://t.co/XjHfFWiWLl">https://t.co/XjHfFWiWLl</a> My favorite: <a href="https://t.co/Iana59QyqN">https://t.co/Iana59QyqN</a> from <a href="https://twitter.com/richardneher">@richardneher</a> <a href="https://twitter.com/trvrb">@trvrb</a> <a href="https://t.co/XTj4bqdsVK">pic.twitter.com/XTj4bqdsVK</a></p>&mdash; Matthew Cotten (@mlcotten13) <a href="https://twitter.com/mlcotten13/status/804960157570662400">December 3, 2016</a></blockquote>
              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr"><a href="https://t.co/RCFZfgStHs">https://t.co/RCFZfgStHs</a> shows the 2016 Nzerekore flare-up, sparked by a a survivor in which the virus remained evolutionarily static. <a href="https://t.co/RXeniJ3gtu">pic.twitter.com/RXeniJ3gtu</a></p>&mdash; Trevor Bedford (@trvrb) <a href="https://twitter.com/trvrb/status/783799220796923904">October 5, 2016</a></blockquote>

            </div>

            <div style={{marginRight:30, marginLeft: 30}} width={200}>
              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">lovely real time analysis of Ebola virus evolution, great example of timely live data sharing <a href="http://t.co/ZZbhehvo44">http://t.co/ZZbhehvo44</a> <a href="http://t.co/vqb3EbOeg1">pic.twitter.com/vqb3EbOeg1</a></p>&mdash; ben goldacre (@bengoldacre) <a href="https://twitter.com/bengoldacre/status/629634451832766464">August 7, 2015</a></blockquote>
              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">See <a href="https://t.co/3K19DNrxgy">https://t.co/3K19DNrxgy</a> used to construct lineages, visualize analysis of Ebola virus evolution, context and course of epidemic <a href="https://twitter.com/hashtag/AGBT16?src=hash">#AGBT16</a></p>&mdash; Orli Bahcall (@obahcall) <a href="https://twitter.com/obahcall/status/698580389598752769">February 13, 2016</a></blockquote>
              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">Benchmark in data visualisation to help understand, track and manage outbreaks is <a href="http://t.co/A1SWuZ5DbM">http://t.co/A1SWuZ5DbM</a> <a href="https://twitter.com/hashtag/mHealthMeetup?src=hash">#mHealthMeetup</a></p>&mdash; Ctrl Group (@ctrl_group) <a href="https://twitter.com/ctrl_group/status/638788232793169920">September 1, 2015</a></blockquote>
              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">Nextstrain uses phylogenetics to track epidemics real-time and understand spread of disease <a href="https://twitter.com/hashtag/openscienceprize?src=hash">#openscienceprize</a> <a href="https://twitter.com/hashtag/BD2KOpenSci?src=hash">#BD2KOpenSci</a></p>&mdash; Lisa Federer (@lisafederer) <a href="https://twitter.com/lisafederer/status/804338351755010050">December 1, 2016</a></blockquote>
              <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">Well said <a href="https://twitter.com/trvrb">@trvrb</a> ! <a href="http://t.co/CqXuO43x7p">http://t.co/CqXuO43x7p</a> <a href="http://t.co/uoq0CO4anX">http://t.co/uoq0CO4anX</a> <a href="http://t.co/zSVEJVVLMI">pic.twitter.com/zSVEJVVLMI</a></p>&mdash; Nick Loman (@pathogenomenick) <a href="https://twitter.com/pathogenomenick/status/612150119518093312">June 20, 2015</a></blockquote>
            </div>
          </Flex>

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

// <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr"><a href="http://t.co/zTlTC5bEJP">http://t.co/zTlTC5bEJP</a> Ebola virus evolution and nanopore sequencing at <a href="https://twitter.com/unibirmingham">@unibirmingham</a> Biosciences open day today <a href="http://t.co/Bnmw5qREuA">pic.twitter.com/Bnmw5qREuA</a></p>&mdash; Nick Loman (@pathogenomenick) <a href="https://twitter.com/pathogenomenick/status/655313321424457728">October 17, 2015</a></blockquote>
// <blockquote className="twitter-tweet" dataLang="en"><p lang="en" dir="ltr">Vote for best Taylor Swift project: <a href="https://t.co/LFLPqF9k0x">https://t.co/LFLPqF9k0x</a> My favorite: <a href="https://t.co/pIvv9jAY6z">https://t.co/pIvv9jAY6z</a> from <a href="https://twitter.com/richardneher">@richardneher</a>… <a href="https://t.co/GrCLAURNJ5">https://t.co/GrCLAURNJ5</a></p>&mdash; OpenDataTaylorSwift (@t_s_institute) <a href="https://twitter.com/t_s_institute/status/804984202550804480">December 3, 2016</a></blockquote>
