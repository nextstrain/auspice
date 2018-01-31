import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { changePageQuery } from "../../actions/navigation";
import { Timeline } from "./extras";
import ReactDOM from "react-dom";

@connect()
export class Focus extends React.Component { // eslint-disable-line
  constructor(props) {
    super(props);
    this.state = {
      timeoutRef: null,
      __html: props.blockHTML,
      style: {opacity: 1},
    };
  }
  static defaultProps = {
    delay: 300
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.url === nextProps.url) {
      return;
    }
    if (this.state.timeoutRef) {
      clearTimeout(this.state.timeoutRef);
    }
    if (!nextProps.url) {
      return;
    }
    const ref = setTimeout(
      () => {
        this.setState({timeoutRef: null, __html: this.props.blockHTML, style: {opacity: 1}});
        this.props.dispatch(changePageQuery({query: queryString.parse(nextProps.url.split('?')[1]), push: true}));
        ReactDOM.findDOMNode(this).scrollTop = 0;
      },
      this.props.delay
    );
    this.setState({timeoutRef: ref, style: {opacity: 0}});
  }

  render() {
    const margin = 20;
    return (
      <div style={{
        minWidth: `${this.props.width - 2 * margin}px`,
        minHeight: `${this.props.height - 2 * margin}px`,
        maxHeight: `${this.props.height - 2 * margin}px`,
        padding: "0px",
        margin: `${margin}px`,
        borderTop: "thin solid #AAA",
        borderBottom: "thin solid #AAA",
        overflow: "auto"
      }}
      >
        <div style={{fontSize: 26}}>
          {this.props.title}
        </div>
        <br/>
        <Timeline w={this.props.width - 2 * margin}/>
        <br/>
        <div
          dangerouslySetInnerHTML={this.state}
          style={{...this.state.style, transition: "opacity 0.3s ease"}}
        />
      </div>
    );
  }
}
