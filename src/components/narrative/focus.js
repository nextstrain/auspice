import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { changePageQuery } from "../../actions/navigation";

@connect()
export class Focus extends React.Component { // eslint-disable-line
  constructor(props) {
    super(props);
    this.state = {
      timeoutRef: null,
      __html: props.blockHTML,
      style: {opacity: 1},
      title: props.title
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
        console.log(this.props.content)
        this.setState({timeoutRef: null, __html: this.props.blockHTML, title: this.props.title, style: {opacity: 1}});
        this.props.dispatch(changePageQuery({query: queryString.parse(nextProps.url.split('?')[1]), push: true}));
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
        borderBottom: "thin solid #AAA"
      }}
      >
        <div style={{...this.state.style, transition: "opacity 0.3s ease", fontSize: 26}}>
          {this.state.title}
        </div>
        <div
          dangerouslySetInnerHTML={this.state}
          style={{...this.state.style, transition: "opacity 0.3s ease"}}
        />
      </div>
    );
  }
}
