const React = require('react');

class Footer extends React.Component {
  docUrl(doc) {
    return `${this.props.config.baseUrl}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <div>
            <a href={this.props.config.baseUrl}>
              <img
                style={{paddingLeft: "20px"}}
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            </a>
          </div>
          <div>
            <h5>External Links</h5>
            <a href="https://github.com/nextstrain/auspice">GitHub repo</a>
            <a href="https://www.npmjs.com/package/auspice">NPM package</a>
            <a href="https://nextstrain.org">Nextstrain</a>
          </div>
          <div>
            <h5>Contact Us</h5>
            <a href="mailto:hello@nextstrain.org">email</a>
            <a href="https://twitter.com/hamesjadfield">twitter</a>
          </div>
        </section>

        <section className="copyright">
          Website built by <a href="https://twitter.com/hamesjadfield">James Hadfield</a> using <a href="https://docusaurus.io">Docusaurus</a>
        </section>
        <section className="copyright">
          If you use auspice, please cite <a href="https://doi.org/10.1093/bioinformatics/bty407">Hadfield et al., 2018</a>
        </section>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
