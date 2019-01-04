const React = require('react');
const CompLibrary = require('../../core/CompLibrary.js'); // eslint-disable-line
const siteConfig = require(`${process.cwd()}/siteConfig.js`); // eslint-disable-line

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;


function imgUrl(img) {
  return `${siteConfig.baseUrl}img/${img}`;
}

function docUrl(doc) {
  return `${siteConfig.baseUrl}${doc}`;
}

const RenderLogos = () => (
  <Container
    padding={['bottom', 'top']}
  >
    <div className={"gridBlock"} style={{justifyContent: "space-around"}}>
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

const Block = (props) => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background={props.background}
  >
    <div className="gridBlock">
      {props.children.map((child) => (
        <div className={`blockElement alignCenter ${props.layout || "fourByGridBlock"}`} key={child.title}>
          <div className="blockContent">
            <h2>{child.title}</h2>
            {child.content}
          </div>
        </div>
      ))}
    </div>
    {props.footer || null}
  </Container>
);

const Introduction = () => (
  <MarkdownBlock>
    Communicating scientific results while also allowing interrogation of the underlying data is an integral part of the scientific process.
    Current scientific publishing practices hinder both the rapid dissemination of epidemiologically relevant results and the ability to easily interact with the data which was used to draw the inferences.
    Initially developed as part of the [nextstrain](https://nextstrain.org) project, it is a more general tool for building different websites to support these aims.
  </MarkdownBlock>
);


const IntroBlocks = () => (
  <Block background="highlight">
    {[
      {
        title: 'Interactive visualisation',
        content: (
          <span>
            Visualisation of bioinformatics results is an integral part of current phylodynamics, both for data exploration and communication.
            We wanted to build a tool that was highly interactive, versatile and customisable.
            <Button href={docUrl("overview")}>Find out more</Button>
          </span>
        )
      },
      {
        title: 'Run auspice locally',
        content: (
          <span>
            Run auspice on your computer to display and interact with your own datasets.
            <Button href={docUrl("installation")}>Find out more</Button>
          </span>
        )
      },
      {
        title: 'Build your own custom website',
        content: (
          <span>
            Auspice is a communication platform to quickly disseminate results to the wider community.
            Use it to generate server-backed or serverless websites to display your own datasets, with as many customisations as you desire.
            <Button href={docUrl("customisations/introduction")}>Find out more</Button>
          </span>
        )
      }
    ]}
  </Block>
);

/* consider moving to siteConfig when the users >> 1, as then
 * can have a seperate "users" page. For now, having them all on
 * the splash page makes sense
 */
const users = [
  {
    name: "Nextstrain",
    link: "https://nextstrain.org",
    caption: "Real-time tracking of pathogen evolution",
    image: "img/nextstrain.png"
  }
];

const Philosophy = () => (
  <Block
    background="highlight"
    footer={(<Button className="highlightBackground" href={docUrl("README")}>go to docs</Button>)}
  >
    {[
      {
        title: 'Use Augur for bioinformatics',
        content: (
          <MarkdownBlock>
            Augur is a seperate toolkit for phylodynamic analysis with a focus on pathgen and outbreak tracking.
            It's designed to work seamlessly with auspice.
            See the [nextstrain documentation]("https://nextstrain.org/docs/bioinformatics/introduction") to find out more.
          </MarkdownBlock>
        )
      },
      {
        title: 'Status: In Development',
        content: (
          <MarkdownBlock>
            We're actively developing auspice to be more versatile and able to power many different websites.
            As such, the current API's are in flux while we develop this functionality.
            If you are interested in helping us develop these ideas and would like to use auspice to build your website
            then please contact us via [email](mailto:hello@nextstrain.org) or [twitter](twitter.com/hamesjadfield).
          </MarkdownBlock>
        )
      }
    ]}
  </Block>
);

const Showcase = () => (
  <Container
    padding={['top', 'bottom']}
  >
    <h2>Auspice is the software which powers:</h2>
    <div className="gridBlock">
      {users.map((user) => (
        <div className={`blockElement alignCenter fourByGridBlock`} key={user.name}>
          <div className="blockContent">
            <h3 style={{marginTop: "0px"}}>
              <a href={user.link} target="_blank" rel="noopener noreferrer">
                {user.name}
              </a>
            </h3>
            <a href={user.link} target="_blank" rel="noopener noreferrer">
              <img src={user.image} alt={user.name} style={{maxHeight: "100px"}}/>
            </a>
            <p>{user.caption}</p>
          </div>
        </div>
      ))}
    </div>
  </Container>
);

class Index extends React.Component { // eslint-disable-line
  render() {
    return (
      <div>
        <SplashContainer>
          <div className="inner" style={{paddingBottom: "100px", paddingTop: "100px"}}>
            <Logo img_src={imgUrl('logo-light.svg')} />
            <ProjectTitle />
            <PromoSection>
              <Introduction/>
            </PromoSection>
          </div>
          <IntroBlocks/>
          <Showcase/>
          <Philosophy/>
          <RenderLogos/>
        </SplashContainer>
      </div>
    );
  }
}

module.exports = Index;
