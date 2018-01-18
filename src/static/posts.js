import React from "react";
import { connect } from "react-redux";
import TitleBar from "../components/framework/title-bar";
import { getPost } from "../util/getMarkdown";

/* This component renders the "shell" of the posts page, i.e. headers, footers etc but not the content.
The content is delivered statically from the server (via actions, reducer etc)

I can't really find a good guide on how to accomplish server delivered HTML to a running app.
There seem to be 2 options:
(1) use dangerouslySetInnerHTML (we do this here)
https://stackoverflow.com/questions/29706828/how-to-render-a-react-element-using-an-html-string
ReactDOM.render(<div dangerouslySetInnerHTML={{__html: htmlString}} />, document.getElementById('postbody'));
(2) use innerHTML
https://stackoverflow.com/questions/37337289/react-js-set-innerhtml-vs-dangerouslysetinnerhtml
*/

@connect((state) => ({
  toc: state.posts.toc, // MOVE
  __html: state.posts.html
}))
class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showTOC: true};
  }
  render() {
    if (!this.props.toc) {
      return (
        <g>
          <TitleBar dataNameHidden postsSelected/>
        </g>
      );
    }
    return (
      <g>
        <TitleBar dataNameHidden postsSelected/>
        <div className="static posts container">
          <div className="bigspacer"/>
          {/* PART 1: the available posts (from the manifest) - TOC */}
          <div className="row">
            <div className="col-md-1"/>
            <div className="col-md-6">
              <input
                id="toggle"
                type="checkbox"
                checked={this.state.showTOC}
                onChange={() => this.setState({showTOC: !this.state.showTOC})}
              />
              <label htmlFor="toggle">
                Available Posts
              </label>
              <div id="toc">
                {this.props.toc.map((d) => (
                  <g key={d.title}>
                    <h3>{d.title}</h3>
                    <ul>
                      {d.posts.map((p) => (
                        <li key={p.title}>
                          <div
                            className={"clickable"}
                            tabIndex="0"
                            role="button"
                            onClick={() => {this.props.dispatch(getPost(p.path));}}
                          >
                            {p.title}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </g>
                ))}
              </div>
            </div>
            <div className="col-md-1"/>
          </div>
          {/* PART 2: the content (inserted from the server) */}
          {this.props.__html ? (
            <div className="row">
              <div className="col-md-1"/>
              <div className="col-md-10" dangerouslySetInnerHTML={this.props}/>
              <div className="col-md-1"/>
            </div>
          ) : null}
        </div>
      </g>
    );
  }
}

export default Posts;
