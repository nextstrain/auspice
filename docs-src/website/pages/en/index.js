const React = require('react'); // eslint-disable-line
const CompLibrary = require('../../core/CompLibrary.js'); // eslint-disable-line
const siteConfig = require(`${process.cwd()}/siteConfig.js`); // eslint-disable-line

/* https://docusaurus.io/docs/en/api-pages#complibrarymarkdownblock */
const MarkdownBlock = CompLibrary.MarkdownBlock;
/* https://docusaurus.io/docs/en/api-pages#complibrarycontainer */
const Container = CompLibrary.Container;


const shortIntroduction = `
Auspice is software to display beautiful interactive visualisations of phylogenomic data.
`;

const mainIntroduction = `
Communicating scientific results while also allowing interrogation of the underlying data is an integral part of the scientific process.
Current scientific publishing practices hinder both the rapid dissemination of epidemiologically relevant results and the ability to easily interact with the data which was used to draw the inferences.
These shortcomings motivated the [nextstrain](https://nextstrain.org) project, for which auspice was initially devloped.

Auspice can be run on your computer or integrated into websites.
It allows easy customisation of aesthetics and functionality, and powers the visualisations on [nextstrain.org](https://nextstrain.org).
`;


function imgUrl(img) {
  return `${siteConfig.baseUrl}img/${img}`;
}

function docUrl(doc) {
  return `${siteConfig.baseUrl}${doc}`;
}

const RenderLogos = () => (
  <Container padding={['bottom', 'top']}>
    <div className="iconsRow">
      <a key={1} href="https://nextstrain.org/" target="_blank" rel="noopener noreferrer">
        <img alt="logo" width="50" src={imgUrl("nextstrain.png")}/>
      </a>
      <a key={1} href="http://www.fredhutch.org/" target="_blank" rel="noopener noreferrer">
        <img alt="logo" width="75" src={imgUrl("fred-hutch-logo-small.png")}/>
      </a>
      <a key={2} href="http://www.eb.tuebingen.mpg.de/" target="_blank" rel="noopener noreferrer">
        <img alt="logo" width="65" src={imgUrl("max-planck-logo.png")}/>
      </a>
      <a key={3} href="https://www.nih.gov/" target="_blank" rel="noopener noreferrer">
        <img alt="logo" width="52" src={imgUrl("nih-logo.jpg")}/>
      </a>
      <a key={4} href="https://erc.europa.eu/" target="_blank" rel="noopener noreferrer">
        <img alt="logo" width="60" src={imgUrl("erc-logo.jpg")}/>
      </a>
      <a key={5} href="https://www.openscienceprize.org/" target="_blank" rel="noopener noreferrer">
        <img alt="logo" width="82" src={imgUrl("osp-logo-small.png")}/>
      </a>
      <a key={6} href="http://biozentrum.org/" target="_blank" rel="noopener noreferrer">
        <img alt="logo" width="85" src={imgUrl("bz-logo.png")} />
      </a>
    </div>
  </Container>
);

class Button extends React.Component { // eslint-disable-line
  render() {
    return (
      <div className="pluginWrapper buttonWrapper" style={{paddingTop: "30px"}}>
        <a className={`button ${this.props.className}`} href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: '_self'
};

const SplashContainer = (props) => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
);

const Logo = (props) => (
  <div className="projectLogo" style={{bottom: "auto", top: "100px"}}>
    <img src={props.img_src} style={{maxHeight: "100px"}} alt="Project Logo" />
  </div>
);

const ProjectTitle = () => (
  <h2 className="projectTitle">
    {siteConfig.title}
    <small>{siteConfig.tagline}</small>
  </h2>
);

const PromoSection = (props) => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
);

const BlockContainer = (props) => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background={props.background}
  >
    <div className="gridBlock">
      {props.children}
    </div>
    {props.footer || null}
  </Container>
);

const Block = ({title, content, buttonText=false, buttonLink=false}) => (
  <div className="blockElement alignCenter fourByGridBlock" key={title}>
    <div className="blockContent">
      <h2>{title}</h2>
      <MarkdownBlock>
        {content}
      </MarkdownBlock>
      {buttonText && buttonLink ? (
        <Button href={buttonLink}>{buttonText}</Button>
      ) : null}
    </div>
  </div>
);

/**
 * The contents of the "blocks" to be displayed on the splash page.
 * Note that most of these are currently unused, but remain here as we hope to use them in the future.
 */
const blockContent = {
  tutorial: {
    title: 'Why interactive visualisation?',
    content: "What can you learn by interacting with the data? Follow these guides to learn about what auspice helped us understand about Zika in the Americas",
    buttonText: "tutorial",
    buttonLink: docUrl("tutorial/overview")
  },
  getStarted: {
    title: "Get started",
    content: "Learn how to install auspice locally get up and running visualising phylogenomic data",
    buttonText: "Installation",
    buttonLink: docUrl("introduction/install")
  },
  build: {
    title: "Build your own website",
    content: "Learn how to use auspice to build customised websites -- either backed by a server or staticallly genenerated (e.g. for GitHub pages).",
    buttonText: "build using github-pages",
    buttonLink: docUrl("build-static/introduction")
  },
  augur: {
    title: "Bioinformatics",
    content: "Augur is our seperate toolkit for phylodynamic analysis with a focus on pathgen and outbreak tracking. It's designed to work seamlessly with auspice. See the [nextstrain documentation](https://nextstrain.org/docs/bioinformatics/introduction) to find out more.",
    buttonText: "go to augur docs",
    buttonLink: "https://nextstrain.org/docs/bioinformatics/introduction/"
  },
  narratives: {
    title: "Narratives",
    content: "Instead of simply presenting the data for someone to explore, use auspice to tell a story where _you_ control what visualisation is presented.",
    buttonText: "writing narratives",
    buttonLink: docUrl("narratives/introduction")
  },
  auspiceUs: {
    title: "Drag & Drop data",
    content: "auspice.us is a customised build of auspice designed to allow users to drag Newick files & metadata on and visualise their data. It's that simple.",
    buttonText: "go to auspice.us",
    buttonLink: "https://auspice.us"
  },
  version: {
    title: "What's new?",
    content: "Auspice is under continual development. See the changes that are bing made, and the version release notes.",
    buttonText: "Release notes",
    buttonLink: docUrl("releases/changelog")
  }
};


class Index extends React.Component { // eslint-disable-line
  render() {
    return (
      <div>
        <SplashContainer>

          <div className="splashTitle">
            <Logo img_src={imgUrl('logo-light.svg')} />
            <ProjectTitle />
            <PromoSection>
              <MarkdownBlock>
                {shortIntroduction}
              </MarkdownBlock>
              <div style={{fontSize: "90%", lineHeight: "140%"}}>
                <MarkdownBlock>
                  {mainIntroduction}
                </MarkdownBlock>
              </div>
            </PromoSection>
          </div>

          <BlockContainer background="highlight">
            <Block {...blockContent.getStarted}/>
            <Block {...blockContent.narratives}/>
            <Block {...blockContent.version}/>
          </BlockContainer>

          <div style={{minHeight: "80px"}} />

          <RenderLogos/>
        </SplashContainer>
      </div>
    );
  }
}

module.exports = Index;


/* UNUSED COMPONENTS
These were removed for v2 release as they are incomplete, however they should reappear
as we fill out the documentation & examples.


const showcaseUsers = {
  nextstrain: {
    name: "Nextstrain",
    link: "https://nextstrain.org",
    caption: "Real-time tracking of pathogen evolution",
    image: "img/nextstrain.png"
  },
  auspiceUs: {
    name: "auspice.us",
    link: "https://auspice-us.herokuapp.com",
    caption: "drag & drop viusualisation",
    image: "img/logo-dark.svg"
  },
  ghana: {
    name: "ARTIC workshop",
    link: "https://artic-network.github.io/artic-workshop",
    caption: "Simulated viral outbreak for a ARTIC workshop in Ghana, built using auspice as a static site generator",
    image: "img/artic-logo.png"
  }
};

const Showcase = (props) => (
  <Container padding={['top', 'bottom']}>
    <h2>Auspice is behind:</h2>
    <div className="gridBlock">
      {props.children}
    </div>
  </Container>
);

const ShowcaseItem = ({name, link, image, caption}) => (
  <div className="blockElement alignCenter fourByGridBlock showcaseItem" key={name}>
    <a href={link} target="_blank" rel="noopener noreferrer">
      <h3 style={{marginTop: "0px"}}>
        {name}
      </h3>
      <img src={image} alt={name} style={{maxHeight: "100px"}}/>
      <p>{caption}</p>
    </a>
  </div>
);
          <Showcase>
            <ShowcaseItem {...showcaseUsers.nextstrain}/>
            <ShowcaseItem {...showcaseUsers.auspiceUs}/>
            <ShowcaseItem {...showcaseUsers.ghana}/>
          </Showcase>


          <div className="soloButtons">
            <Button href={docUrl("introduction/overview")}>Read the docs</Button>
            <Button href={docUrl("tutorial/overview")}>Learn how to interpret datasets</Button>
          </div>

*/
