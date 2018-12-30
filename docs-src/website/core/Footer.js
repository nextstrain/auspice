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
	    <h5>Docs</h5>
	    <a href={this.props.config.baseUrl}>Splash Page</a>
	    <a href={this.docUrl("README")}>Overview</a>
	  </div>
	  <div>
	    <h5>Links</h5>
	    <a href="https://github.com/nextstrain/auspice">GitHub</a>
	    <a href="https://www.npmjs.com/package/auspice">NPM</a>
	    <a href="https://nextstrain.org">Nextstrain</a>
	  </div>
	  <div>
	    <h5>Contact</h5>
	    <a href="mailto:hello@nextstrain.org">email</a>
	    <a href="https://twitter.com/hamesjadfield">twitter</a>
	  </div>
	</section>

	<section className="copyright">If you use auspice, please cite <a href="https://doi.org/10.1093/bioinformatics/bty407">Hadfield et al., 2018</a></section>
	<section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
