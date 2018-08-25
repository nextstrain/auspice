/* eslint-disable no-multi-spaces */
import React from "react";
import { normalNavBarHeight, narrativeNavBarHeight, titleColors } from "../../util/globals";
import { darkGrey } from "../../globalStyles";
import SidebarChevron from "../framework/sidebar-chevron";
import { TOGGLE_NARRATIVE } from "../../actions/types";

const logoPNG = require("../../images/nextstrain-logo-small.png");

const getStyles = ({minified=true, narrative=false, width}={}) => ({
  mainContainer: {
    maxWidth: 960,
    marginTop: "auto",
    marginRight: "auto",
    marginBottom: "auto",
    marginLeft: "auto",
    height: narrative ? narrativeNavBarHeight : normalNavBarHeight,
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
    left: 0,
    zIndex: 100,
    transition: "left .3s ease-out"
  },
  flexColumns: {
    display: "flex",
    flexDirection: "row",
    whiteSpace: "nowrap",
    justifyContent: "center",
    alignItems: "center"
  },
  flexRows: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    padding: "0px",
    color: "#000",
    textDecoration: "none",
    fontSize: 20,
    fontWeight: 400,
    cursor: "pointer"
  },
  link: {
    padding: minified ? "6px 12px" : "20px 20px",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontSize: minified ? 12 : 16,
    fontWeight: 400,
    textTransform: "uppercase",
    color: minified ? "#000" : darkGrey
  },
  logo: {
    padding: "5px 5px",
    width: "50px",
    cursor: "pointer"
  },
  narrativeTitle: {
    whiteSpace: "nowrap",
    fontSize: 16,
    marginLeft: "auto",
    padding: "0px 12px",
    float: "right",
    maxWidth: `${width-90}px`,
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
});

const renderLink = (text, url, style) => (
  <a key={text} style={style} href={url}>
    {text}
  </a>
);

const renderNextstrainTitle = (style) => (
  <a id="RainbowNextstrain" style={style} href="/">
    {"Nextstrain".split("").map((letter, i) =>
      <span key={i} style={{color: titleColors[i]}}>{letter}</span>
    )}
  </a>
);

const renderNarrativeTitle = (text, style) => (
  <div style={style}>
    {`Narrative: ${text}`}
  </div>
);

const renderViewInteractiveLink = (dispatch, style) => (
  <div
    key="viewinteractivedata"
    style={style}
    onClick={() => dispatch({type: TOGGLE_NARRATIVE, display: false})}
  >
    View interactive data
  </div>
);


const NavBar = ({minified, mobileDisplay, toggleHandler, narrativeTitle, width, dispatch}) => {
  const styles = getStyles({minified, narrative: !!narrativeTitle, width});
  let links = [
    renderLink("About", "/about",   styles.link),
    renderLink("Docs",  "/docs",    styles.link),
    renderLink("Blog",  "/blog",    styles.link)
  ];
  if (narrativeTitle) {
    if (mobileDisplay) {
      links = [renderViewInteractiveLink(dispatch, styles.link)];
    } else {
      links.push(renderViewInteractiveLink(dispatch, styles.link));
    }
  }
  return (
    <div id="NavBarContainer" style={styles.mainContainer}>
      <div style={styles.flexColumns}>
        <a id="Logo" style={styles.logo} href="/">
          <img alt="splashPage" width="40px" src={logoPNG}/>
        </a>
        {minified ? null : renderNextstrainTitle(styles.title)}
        <div id="spacer" style={{flex: 5}}/>
        <div style={styles.flexRows}>
          <div style={styles.flexColumns}>
            {links}
          </div>
          {narrativeTitle ? renderNarrativeTitle(narrativeTitle, styles.narrativeTitle) : null}
        </div>
        {minified && !narrativeTitle ?
          (<SidebarChevron mobileDisplay={mobileDisplay} handler={toggleHandler}/>) :
          (<div id="spacer" style={{flex: 1}}/>)
        }
      </div>
    </div>
  );
};

export default NavBar;
